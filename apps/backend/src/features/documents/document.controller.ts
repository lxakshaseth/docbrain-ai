import path from 'path';
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

  public static downloadFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const document = await DocumentService.getDocumentById(userId, id);
    return res.sendFile(path.resolve(document.fileUrl));
  });

  public static getSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const summary = await DocumentService.getSummary(userId, id);
    return ApiResult.success(res, summary, 'Fetched document summary and mind map');
  });

  public static getStudySet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const studySet = await DocumentService.getStudySet(userId, id);
    return ApiResult.success(res, studySet, 'Generated study quiz and flashcard set');
  });

  public static generateAudio = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const audioData = await DocumentService.generateAudioOverview(userId, id);
    return ApiResult.success(res, audioData, 'Generated audio overview podcast');
  });

  public static toggleShare = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;
    const updatedDoc = await DocumentService.togglePublicShare(userId, id);
    return ApiResult.success(res, updatedDoc, 'Updated document share settings');
  });

  public static getPublicDocument = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { shareToken } = req.params;
    const doc = await DocumentService.getPublicDocument(shareToken);
    return ApiResult.success(res, doc, 'Fetched public shared document');
  });

  public static getPublicFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { shareToken } = req.params;
    const doc = await DocumentService.getPublicDocument(shareToken);
    return res.sendFile(path.resolve(doc.fileUrl));
  });

  public static getPublicSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { shareToken } = req.params;
    const doc = await DocumentService.getPublicDocument(shareToken);
    const summary = await DocumentService.getSummary(doc.userId.toString(), doc.id);
    return ApiResult.success(res, summary, 'Fetched public document summary');
  });

  public static publicChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { shareToken } = req.params;
    const { query, conversationId } = req.body;
    const response = await DocumentService.publicChat(shareToken, query, conversationId);
    return ApiResult.success(res, response, 'Public chat response');
  });

  public static compare = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { documentIds } = req.body;
    const comparison = await DocumentService.compareDocuments(userId, documentIds || []);
    return ApiResult.success(res, comparison, 'Generated document comparison matrix');
  });
}
