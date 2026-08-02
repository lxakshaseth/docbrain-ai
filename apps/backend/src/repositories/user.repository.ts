import { UserModel, IUserDocument } from '../models/User.js';
import { UserRole } from '@pdf-chatbot/shared';

export class UserRepository {
  public async findByEmail(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() });
  }

  public async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ email: email.toLowerCase() }).select('+passwordHash');
  }

  public async findById(id: string): Promise<IUserDocument | null> {
    return UserModel.findById(id);
  }

  public async create(data: { email: string; name: string; passwordHash: string; role?: UserRole }): Promise<IUserDocument> {
    return UserModel.create(data);
  }

  public async updateRole(userId: string, role: UserRole): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(userId, { role }, { new: true });
  }
}

export const userRepository = new UserRepository();
