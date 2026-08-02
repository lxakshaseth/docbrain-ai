import { Response } from 'express';
import { AuthService } from './auth.service.js';
import { AuthenticatedRequest } from './auth.middleware.js';
import { ApiResult } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../core/asyncHandler.js';

export class AuthController {
  public static register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return ApiResult.error(res, 'Email, password, and name are required', 400);
    }
    const result = await AuthService.register({ email, password, name });
    return ApiResult.success(res, result, 'User registered successfully', 201);
  });

  public static login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return ApiResult.error(res, 'Email and password are required', 400);
    }
    const result = await AuthService.login({ email, password });
    return ApiResult.success(res, result, 'Login successful');
  });

  public static getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const user = await AuthService.getUserById(userId);
    return ApiResult.success(res, user, 'Fetched current user profile');
  });
}
