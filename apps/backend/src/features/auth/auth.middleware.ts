import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env.js';
import { AppError } from '../../core/appError.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authenticateJwt = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return next(new AppError('Unauthorized: Missing token', 401));
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { sub: string; role: string };
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return next(new AppError('Unauthorized: Invalid or expired token', 401));
  }
};
