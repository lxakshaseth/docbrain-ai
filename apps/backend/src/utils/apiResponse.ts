import { Response } from 'express';
import { ApiResponse } from '@pdf-chatbot/shared';

export class ApiResult {
  public static success<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200): Response {
    const payload: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(payload);
  }

  public static error(
    res: Response,
    message: string = 'Internal Server Error',
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ): Response {
    const payload: ApiResponse = {
      success: false,
      message,
      error: {
        code,
        details,
      },
    };
    return res.status(statusCode).json(payload);
  }
}
