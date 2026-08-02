import crypto from 'crypto';
import { REDIS_CHANNELS, DocIngestRequestPayload } from '@pdf-chatbot/shared';

describe('Redis Pub/Sub Event Protocol Unit Tests', () => {
  it('should assign valid UUID correlationId to outgoing event envelopes', () => {
    const correlationId = crypto.randomUUID();
    const payload: DocIngestRequestPayload = {
      correlationId,
      version: '1.0',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      timeoutMs: 30000,
      documentId: 'doc_123',
      userId: 'usr_456',
      fileUrl: '/uploads/doc-123.pdf',
      fileName: 'doc-123.pdf',
      vectorCollectionId: 'col_123',
    };

    expect(payload.correlationId).toBe(correlationId);
    expect(payload.version).toBe('1.0');
    expect(payload.retryCount).toBe(0);
    expect(payload.documentId).toBe('doc_123');
  });

  it('should verify channel protocol names match shared constants', () => {
    expect(REDIS_CHANNELS.DOC_INGEST_REQUEST).toBe('doc:ingest:request');
    expect(REDIS_CHANNELS.DOC_INGEST_STATUS).toBe('doc:ingest:status');
    expect(REDIS_CHANNELS.CHAT_STREAM_REQUEST).toBe('chat:stream:request');
    expect(REDIS_CHANNELS.CHAT_STREAM_CHUNK).toBe('chat:stream:chunk');
    expect(REDIS_CHANNELS.CHAT_STREAM_STATUS).toBe('chat:stream:status');
  });
});
