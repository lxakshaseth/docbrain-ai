// Redis Pub/Sub Channels and Resilient Event Protocol

export const REDIS_CHANNELS = {
  DOC_INGEST_REQUEST: 'doc:ingest:request',
  DOC_INGEST_STATUS: 'doc:ingest:status',
  CHAT_STREAM_REQUEST: 'chat:stream:request',
  CHAT_STREAM_CHUNK: 'chat:stream:chunk',
  CHAT_STREAM_STATUS: 'chat:stream:status',
} as const;

export interface BaseEventEnvelope {
  correlationId: string;
  version: string;
  timestamp: string;
  retryCount?: number;
  timeoutMs?: number;
}

export interface DocIngestRequestPayload extends BaseEventEnvelope {
  documentId: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  vectorCollectionId: string;
}

export interface DocIngestStatusPayload extends BaseEventEnvelope {
  documentId: string;
  status: 'processing' | 'completed' | 'failed';
  chunkCount?: number;
  errorReason?: string;
}

export interface ChatStreamRequestPayload extends BaseEventEnvelope {
  requestId: string;
  conversationId: string;
  documentId: string;
  userId: string;
  query: string;
  vectorCollectionId: string;
}

export interface ChatStreamChunkPayload extends BaseEventEnvelope {
  requestId: string;
  conversationId: string;
  chunkText: string;
  index: number;
}

export interface ChatStreamStatusPayload extends BaseEventEnvelope {
  requestId: string;
  conversationId: string;
  status: 'started' | 'completed' | 'failed' | 'error';
  answer?: string;
  sources?: Array<{
    pageNumber: number;
    snippet: string;
    score: number;
  }>;
  suggestedQuestions?: string[];
  errorMessage?: string;
}
