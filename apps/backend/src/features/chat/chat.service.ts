import crypto from 'crypto';
import { conversationRepository } from '../../repositories/conversation.repository.js';
import { messageRepository } from '../../repositories/message.repository.js';
import { documentRepository } from '../../repositories/document.repository.js';
import { AppError } from '../../core/appError.js';
import { redisPublisher, isRedisConnected } from '../../redis/redisClient.js';
import { REDIS_CHANNELS, ChatStreamRequestPayload, IConversation, IMessage } from '@pdf-chatbot/shared';

export class ChatService {
  public static async createConversation(userId: string, documentId: string, title?: string): Promise<IConversation> {
    const doc = await documentRepository.findByIdAndUser(documentId, userId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    const conversation = await conversationRepository.create({
      userId,
      documentId,
      title: title || `Chat with ${doc.title}`,
    });

    return conversation.toJSON() as unknown as IConversation;
  }

  public static async getUserConversations(userId: string): Promise<IConversation[]> {
    const conversations = await conversationRepository.findByUserId(userId);
    return conversations.map((c) => c.toJSON() as unknown as IConversation);
  }

  public static async getChatHistory(userId: string, documentId?: string, conversationId?: string): Promise<IMessage[]> {
    let targetConvId = conversationId;

    if (!targetConvId && documentId) {
      const conv = await conversationRepository.findByDocumentAndUser(documentId, userId);
      if (conv) {
        targetConvId = conv.id;
      } else {
        return [];
      }
    }

    if (!targetConvId) {
      throw new AppError('Either conversationId or documentId must be provided', 400);
    }

    const conv = await conversationRepository.findByIdAndUser(targetConvId, userId);
    if (!conv) {
      throw new AppError('Conversation not found', 404);
    }

    const messages = await messageRepository.findByConversationId(targetConvId);
    return messages.map((m) => m.toJSON() as unknown as IMessage);
  }

  public static async sendChatQuery(
    userId: string,
    documentId: string,
    query: string,
    conversationId?: string
  ): Promise<{ userMessage: IMessage; requestId: string; conversationId: string; correlationId: string }> {
    const doc = await documentRepository.findByIdAndUser(documentId, userId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    if (doc.status !== 'completed') {
      throw new AppError(`Document is currently in '${doc.status}' state. RAG chat requires completed ingestion.`, 400);
    }

    let conv = conversationId
      ? await conversationRepository.findByIdAndUser(conversationId, userId)
      : await conversationRepository.findByDocumentAndUser(documentId, userId);

    if (!conv) {
      conv = await conversationRepository.create({
        userId,
        documentId,
        title: `Chat with ${doc.title}`,
      });
    }

    // Save User Query Message
    const userMsgDoc = await messageRepository.create({
      conversationId: conv.id,
      sender: 'user',
      content: query,
    });

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const correlationId = crypto.randomUUID();

    const payload: ChatStreamRequestPayload = {
      correlationId,
      version: '1.0',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      timeoutMs: 45000,
      requestId,
      conversationId: conv.id,
      documentId: doc.id,
      userId,
      query,
      vectorCollectionId: doc.vectorCollectionId,
    };

    if (!isRedisConnected()) {
      throw new AppError(
        'Message broker (Redis) is currently unavailable. Chat request could not be queued.',
        503
      );
    }

    // Dispatch RAG task to Redis Pub/Sub
    await redisPublisher.publish(REDIS_CHANNELS.CHAT_STREAM_REQUEST, JSON.stringify(payload));

    return {
      userMessage: userMsgDoc.toJSON() as unknown as IMessage,
      requestId,
      conversationId: conv.id,
      correlationId,
    };
  }
}
