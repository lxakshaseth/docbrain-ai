import { Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { ChatService } from './chat.service.js';
import { ApiResult } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../core/asyncHandler.js';

export class ChatController {
  public static processChat = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { documentId, query, conversationId } = req.body;
    if (!documentId || !query) {
      return ApiResult.error(res, 'documentId and query text are required', 400);
    }
    const result = await ChatService.sendChatQuery(userId, documentId, query, conversationId);
    return ApiResult.success(res, result, 'Chat query dispatched to AI RAG engine', 200);
  });

  public static getHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const documentId = req.query.documentId as string | undefined;
    const conversationId = req.query.conversationId as string | undefined;

    const messages = await ChatService.getChatHistory(userId, documentId, conversationId);
    return ApiResult.success(res, messages, 'Fetched chat history');
  });

  public static getMessagesForConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId;

    const messages = await ChatService.getChatHistory(userId, undefined, conversationId);
    return ApiResult.success(res, messages, 'Fetched conversation messages');
  });

  public static createConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const { documentId, title } = req.body;
    if (!documentId) {
      return ApiResult.error(res, 'Document ID is required', 400);
    }
    const conversation = await ChatService.createConversation(userId, documentId, title);
    return ApiResult.success(res, conversation, 'Conversation created successfully', 201);
  });

  public static listConversations = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const conversations = await ChatService.getUserConversations(userId);
    return ApiResult.success(res, conversations, 'Fetched conversations');
  });

  public static deleteConversation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    const conversationId = req.params.conversationId;
    await ChatService.deleteConversation(userId, conversationId);
    return ApiResult.success(res, { conversationId }, 'Conversation session deleted successfully');
  });
}
