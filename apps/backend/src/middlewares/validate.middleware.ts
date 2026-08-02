import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResult } from '../utils/apiResponse.js';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = {
        ...(req.body || {}),
        ...(req.query || {}),
        ...(req.params || {}),
      };
      await schema.parseAsync(dataToValidate);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        const firstIssueMsg = issues[0] ? `${issues[0].field}: ${issues[0].message}` : 'Validation error';
        return ApiResult.error(res, firstIssueMsg, 400, 'VALIDATION_ERROR', issues);
      }
      return next(error);
    }
  };
};
