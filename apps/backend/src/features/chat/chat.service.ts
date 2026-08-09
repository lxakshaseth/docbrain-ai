import crypto from 'crypto';
import { config } from '../../config/env.js';
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

    if (isRedisConnected()) {
      // Dispatch RAG task to Redis Pub/Sub
      await redisPublisher.publish(REDIS_CHANNELS.CHAT_STREAM_REQUEST, JSON.stringify(payload));
    } else {
      // HTTP Fallback to AI Service /api/v1/query
      (async () => {
        try {
          const aiCandidateUrls = [
            config.aiServiceUrl,
            process.env.AI_SERVICE_URL || '',
            'https://docbrain-ai-1.onrender.com',
            'http://127.0.0.1:8001',
            'http://localhost:8001',
          ].filter(Boolean);

          const uniqueUrls = Array.from(new Set(aiCandidateUrls));
          let querySuccess = false;

          for (const baseUrl of uniqueUrls) {
            try {
              const resp = await fetch(`${baseUrl}/api/v1/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query,
                  collection_name: doc.vectorCollectionId,
                  conversation_id: conv!.id,
                  top_k: 4,
                }),
              });
              if (resp.ok) {
                const data = await resp.json();
                const answerText = data.answer || data.content || 'AI response received.';
                await messageRepository.create({
                  conversationId: conv!.id,
                  sender: 'assistant',
                  content: answerText,
                  sources: data.sources || [],
                });
                querySuccess = true;
                break;
              }
            } catch (_) {}
          }

          if (!querySuccess) {
            await messageRepository.create({
              conversationId: conv!.id,
              sender: 'assistant',
              content: 'Sorry, the AI service is currently unreachable. Please verify AI_SERVICE_URL in Render settings.',
            });
          }
        } catch (err: any) {
          console.error('HTTP chat query fallback failed:', err.message || err);
          await messageRepository.create({
            conversationId: conv!.id,
            sender: 'assistant',
            content: 'Sorry, the AI service is currently unavailable. Please ensure the Python AI service is running.',
          });
        }
      })();
    }

    return {
      userMessage: userMsgDoc.toJSON() as unknown as IMessage,
      requestId,
      conversationId: conv.id,
      correlationId,
    };
  }

  public static async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    const conv = await conversationRepository.findByIdAndUser(conversationId, userId);
    if (!conv) {
      throw new AppError('Conversation not found', 404);
    }
    await messageRepository.deleteByConversationId(conversationId);
    return conversationRepository.deleteByIdAndUser(conversationId, userId);
  }
}
