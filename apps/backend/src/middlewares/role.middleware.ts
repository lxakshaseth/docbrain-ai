import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../features/auth/auth.middleware.js';
import { AppError } from '../core/appError.js';
import { UserRole } from '@pdf-chatbot/shared';

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Unauthorized: Authentication required', 401));
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(new AppError('Forbidden: Access denied for your role', 403));
    }

    next();
  };
};
