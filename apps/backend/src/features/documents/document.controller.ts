import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { DocumentService } from './document.service.js';
import { ApiResult } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../core/asyncHandler.js';

export class DocumentController {
  public static upload = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.file) {
      return ApiResult.error(res, 'No PDF file uploaded', 400);
    }
    const userId = req.user!.id;
    const document = await DocumentService.uploadDocument(userId, req.file);
    return ApiResult.success(res, document, 'Document uploaded successfully and queued for AI ingestion', 201);
  });

  public static list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const documents = await DocumentService.getUserDocuments(userId);
    return ApiResult.success(res, documents, 'Fetched user documents');
  });

  public static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const document = await DocumentService.getDocumentById(userId, id);
    return ApiResult.success(res, document, 'Fetched document details');
  });

  public static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    await DocumentService.deleteDocument(userId, id);
    return ApiResult.success(res, null, 'Document deleted successfully');
  });

  public static reprocess = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const document = await DocumentService.reprocessDocument(userId, id);
    return ApiResult.success(res, document, 'Document re-ingestion task triggered successfully');
  });
}
