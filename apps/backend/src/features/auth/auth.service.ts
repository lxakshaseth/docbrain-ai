import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../../repositories/user.repository.js';
import { config } from '../../config/env.js';
import { AppError } from '../../core/appError.js';
import { IUser, UserRole } from '@pdf-chatbot/shared';
import { LoginInput, RegisterInput } from '../../dtos/auth.dto.js';

export interface AuthResponse {
  user: IUser;
  token: string;
}

export class AuthService {
  public static async register(dto: RegisterInput): Promise<AuthResponse> {
    const existingUser = await userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new AppError('Email is already registered', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const userDoc = await userRepository.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      role: dto.role || ('user' as UserRole),
    });

    const token = this.generateToken(userDoc.id, userDoc.role);
    return {
      user: userDoc.toJSON() as unknown as IUser,
      token,
    };
  }

  public static async login(dto: LoginInput): Promise<AuthResponse> {
    const userDoc = await userRepository.findByEmailWithPassword(dto.email);
    if (!userDoc) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(dto.password, userDoc.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(userDoc.id, userDoc.role);
    return {
      user: userDoc.toJSON() as unknown as IUser,
      token,
    };
  }

  public static async getUserById(userId: string): Promise<IUser> {
    const userDoc = await userRepository.findById(userId);
    if (!userDoc) {
      throw new AppError('User not found', 404);
    }
    return userDoc.toJSON() as unknown as IUser;
  }

  private static generateToken(userId: string, role: string): string {
    return jwt.sign(
      { sub: userId, role },
      config.jwt.secret as jwt.Secret,
      { expiresIn: '7d' }
    );
  }
}
