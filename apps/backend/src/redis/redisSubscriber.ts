import { redisSubscriber, isRedisConnected } from './redisClient.js';
import { logger } from '../core/logger.js';
import { DocumentModel } from '../models/Document.js';
import { MessageModel } from '../models/Message.js';
import {
  REDIS_CHANNELS,
  DocIngestStatusPayload,
  ChatStreamStatusPayload,
} from '@pdf-chatbot/shared';

let isListenerAttached = false;

export const startRedisSubscriber = async () => {
  if (redisSubscriber.status !== 'ready') {
    logger.warn('Skipping Redis Subscriber setup: Redis subscriber client is not connected');
    return;
  }

  try {
    await redisSubscriber.subscribe(
      REDIS_CHANNELS.DOC_INGEST_STATUS,
      REDIS_CHANNELS.CHAT_STREAM_STATUS
    );

    if (!isListenerAttached) {
      redisSubscriber.on('message', async (channel, messageStr) => {
        try {
          const payload = JSON.parse(messageStr);
          const correlationId = payload.correlationId || 'N/A';

          if (channel === REDIS_CHANNELS.DOC_INGEST_STATUS) {
            const statusPayload = payload as DocIngestStatusPayload;
            logger.info(
              `Received Doc Ingest Status [corrId=${correlationId}, docId=${statusPayload.documentId}]: ${statusPayload.status}`
            );

            await DocumentModel.findByIdAndUpdate(statusPayload.documentId, {
              status: statusPayload.status,
              chunkCount: statusPayload.chunkCount || 0,
              errorReason: statusPayload.errorReason,
            });
          }

          if (channel === REDIS_CHANNELS.CHAT_STREAM_STATUS) {
            const streamPayload = payload as ChatStreamStatusPayload;
            logger.info(
              `Received Chat Stream Status [corrId=${correlationId}, convId=${streamPayload.conversationId}]: ${streamPayload.status}`
            );

            if (streamPayload.status === 'completed') {
              const answerContent =
                streamPayload.answer ||
                'Completed generating answer based on uploaded PDF document context.';
              // Save Assistant response when stream completes
              await MessageModel.create({
                conversationId: streamPayload.conversationId,
                sender: 'assistant',
                content: answerContent,
                sources: streamPayload.sources || [],
                suggestedQuestions: streamPayload.suggestedQuestions || [],
              });
              logger.info(
                `Saved assistant response message to MongoDB for convId=${streamPayload.conversationId}`
              );
            } else if (streamPayload.status === 'failed' || streamPayload.status === 'error') {
              const errorContent = streamPayload.errorMessage || 'An error occurred while generating response.';
              await MessageModel.create({
                conversationId: streamPayload.conversationId,
                sender: 'assistant',
                content: `⚠️ ${errorContent}`,
                sources: [],
                suggestedQuestions: [],
              });
              logger.error(
                `Saved assistant error message to MongoDB for convId=${streamPayload.conversationId}: ${errorContent}`
              );
            }
          }
        } catch (err) {
          logger.error(`Error processing Redis message on channel ${channel}:`, err);
        }
      });
      isListenerAttached = true;
    }

    logger.info('Redis Subscriber listening on DOC_INGEST_STATUS and CHAT_STREAM_STATUS channels');
  } catch (error) {
    logger.error('Failed to initialize Redis Subscriber:', error);
  }
};
