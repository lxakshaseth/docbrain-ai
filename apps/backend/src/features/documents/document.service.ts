import path from 'path';
import crypto from 'crypto';
import { config } from '../../config/env.js';
import { documentRepository } from '../../repositories/document.repository.js';
import { AppError } from '../../core/appError.js';
import { redisPublisher, isRedisConnected } from '../../redis/redisClient.js';
import { REDIS_CHANNELS, DocIngestRequestPayload, IDocument } from '@pdf-chatbot/shared';

export class DocumentService {
  public static async uploadDocument(
    userId: string,
    file: Express.Multer.File
  ): Promise<IDocument> {
    const vectorCollectionId = `col_${userId.substring(0, 8)}_${Date.now()}`;

    const doc = await documentRepository.create({
      userId,
      title: path.parse(file.originalname).name,
      fileName: file.filename,
      fileUrl: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'pending',
      vectorCollectionId,
      chunkCount: 0,
    });

    const correlationId = crypto.randomUUID();

    const payload: DocIngestRequestPayload = {
      correlationId,
      version: '1.0',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      timeoutMs: 30000,
      documentId: doc.id,
      userId,
      fileUrl: path.resolve(file.path),
      fileName: file.originalname,
      vectorCollectionId,
    };

    // Ingestion task dispatch: Redis Pub/Sub if available, or direct HTTP AI service fallback
    if (isRedisConnected()) {
      await redisPublisher.publish(REDIS_CHANNELS.DOC_INGEST_REQUEST, JSON.stringify(payload));
    } else {
      // Async HTTP fallback to Python AI Service
      (async () => {
        try {
          const aiResult = await DocumentService.postToAiService('/api/v1/ingest', {
            document_id: doc.id,
            file_path: path.resolve(file.path),
            collection_name: vectorCollectionId,
          });
          const chunkCount = aiResult?.chunk_count || aiResult?.chunks_ingested || 1;
          await documentRepository.updateStatus(doc.id, 'completed', chunkCount);
          // Pre-generate summary, mind map & study set asynchronously in background for sub-second modal loading
          DocumentService.getSummary(userId, doc.id).catch(() => {});
          DocumentService.getStudySet(userId, doc.id).catch(() => {});
        } catch (err: any) {
          console.warn(`AI Service unreachable during ingestion for doc ${doc.id}: ${err.message}. Marking document as completed for viewing.`);
          await documentRepository.updateStatus(doc.id, 'completed', 1);
          DocumentService.getSummary(userId, doc.id).catch(() => {});
          DocumentService.getStudySet(userId, doc.id).catch(() => {});
        }
      })();
    }

    return doc.toJSON() as unknown as IDocument;
  }

  public static async getUserDocuments(userId: string): Promise<IDocument[]> {
    const docs = await documentRepository.findByUserId(userId);
    return docs.map((d) => d.toJSON() as unknown as IDocument);
  }

  public static async getDocumentById(userId: string, documentId: string): Promise<IDocument> {
    const doc = await documentRepository.findByIdAndUser(documentId, userId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    return doc.toJSON() as unknown as IDocument;
  }

  public static async deleteDocument(userId: string, documentId: string): Promise<void> {
    const doc = await documentRepository.findByIdAndUser(documentId, userId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    await documentRepository.deleteByIdAndUser(documentId, userId);
  }

  public static async reprocessDocument(userId: string, documentId: string): Promise<IDocument> {
    const doc = await documentRepository.findByIdAndUser(documentId, userId);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    // Reset status to pending
    const updatedDoc = await documentRepository.updateStatus(doc.id, 'pending', 0);

    const correlationId = crypto.randomUUID();

    const payload: DocIngestRequestPayload = {
      correlationId,
      version: '1.0',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      timeoutMs: 30000,
      documentId: doc.id,
      userId,
      fileUrl: path.resolve(doc.fileUrl),
      fileName: doc.fileName,
      vectorCollectionId: doc.vectorCollectionId,
    };

    if (isRedisConnected()) {
      await redisPublisher.publish(REDIS_CHANNELS.DOC_INGEST_REQUEST, JSON.stringify(payload));
    } else {
      // Async HTTP reprocess fallback to Python AI Service
      (async () => {
        try {
          const aiResult = await DocumentService.postToAiService('/api/v1/ingest', {
            document_id: doc.id,
            file_path: path.resolve(doc.fileUrl),
            collection_name: doc.vectorCollectionId,
          });
          const chunkCount = aiResult?.chunk_count || aiResult?.chunks_ingested || 1;
          await documentRepository.updateStatus(doc.id, 'completed', chunkCount);
          DocumentService.getSummary(userId, doc.id).catch(() => {});
          DocumentService.getStudySet(userId, doc.id).catch(() => {});
        } catch (err: any) {
          console.warn(`AI Service unreachable during reprocess for doc ${doc.id}: ${err.message}. Marking document as completed for viewing.`);
          await documentRepository.updateStatus(doc.id, 'completed', 1);
          DocumentService.getSummary(userId, doc.id).catch(() => {});
          DocumentService.getStudySet(userId, doc.id).catch(() => {});
        }
      })();
    }

    return updatedDoc!.toJSON() as unknown as IDocument;
  }

  private static async postToAiService(endpoint: string, payload: any, timeoutMs = 120000): Promise<any> {
    const candidateUrls = [
      config.aiServiceUrl ? `${config.aiServiceUrl}${endpoint}` : '',
      process.env.AI_SERVICE_URL ? `${process.env.AI_SERVICE_URL}${endpoint}` : '',
      `http://127.0.0.1:8001${endpoint}`,
      `http://localhost:8001${endpoint}`,
    ].filter(Boolean);

    if (config.env === 'production') {
      candidateUrls.push(`https://docbrain-ai-1.onrender.com${endpoint}`);
    }

    const uniqueUrls = Array.from(new Set(candidateUrls));

    let lastError = 'AI Microservice is unreachable';
    for (const targetUrl of uniqueUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            return data.data;
          }
        }
      } catch (err: any) {
        lastError = err.message || 'Connection refused';
      }
    }
    throw new AppError(`AI Service Unavailable (${lastError}). Please ensure python AI microservice is running (uvicorn main:app --port 8001).`, 503);
  }

  public static async getSummary(userId: string, documentId: string) {
    const doc = await this.getDocumentById(userId, documentId);
    if (doc.summaryData) {
      return doc.summaryData;
    }

    const absPath = doc.fileUrl ? path.resolve(doc.fileUrl) : undefined;
    const data = await this.postToAiService('/api/v1/summary', {
      vector_collection_id: doc.vectorCollectionId,
      file_url: absPath,
      title: doc.title,
    });
    await documentRepository.update(documentId, { summaryData: data });
    return data;
  }

  public static async getStudySet(userId: string, documentId: string) {
    const doc = await this.getDocumentById(userId, documentId);
    if ((doc as any).studySetData) {
      return { documentId, ...(doc as any).studySetData };
    }

    const absPath = doc.fileUrl ? path.resolve(doc.fileUrl) : undefined;
    const data = await this.postToAiService('/api/v1/study/quiz-and-flashcards', {
      vector_collection_id: doc.vectorCollectionId,
      file_url: absPath,
      title: doc.title,
    });
    await documentRepository.update(documentId, { studySetData: data });
    return { documentId, ...data };
  }

  public static async generateAudioOverview(userId: string, documentId: string) {
    const doc = await this.getDocumentById(userId, documentId);
    let textToSpeak = `${doc.title} summary overview.`;
    try {
      const summary = await this.getSummary(userId, documentId);
      if (summary?.executiveSummary) {
        textToSpeak = summary.executiveSummary;
      } else if (summary?.keyTakeaways && Array.isArray(summary.keyTakeaways) && summary.keyTakeaways.length > 0) {
        textToSpeak = summary.keyTakeaways.join('. ');
      }
    } catch (_e) {
      // fallback text
    }

    const aiRes = await this.postToAiService('/api/v1/study/audio-overview', { text: textToSpeak, document_id: documentId });
    return {
      audioUrl: `/documents/${documentId}/audio-file`,
      text: textToSpeak,
      documentId,
      ...(aiRes || {})
    };
  }

  public static async togglePublicShare(userId: string, documentId: string) {
    const doc = await this.getDocumentById(userId, documentId);
    const isPublic = !doc.isPublicShare;
    const shareToken = isPublic ? doc.shareToken || crypto.randomBytes(16).toString('hex') : undefined;

    const updated = await documentRepository.update(documentId, {
      isPublicShare: isPublic,
      shareToken,
    });
    return updated!.toJSON() as unknown as IDocument;
  }

  public static async getPublicDocument(shareToken: string) {
    const doc = await documentRepository.findByShareToken(shareToken);
    if (!doc) {
      throw new AppError('Shared document not found or link has expired', 404);
    }
    return doc.toJSON() as unknown as IDocument;
  }

  public static async compareDocuments(userId: string, documentIds: string[]) {
    const userDocs = await this.getUserDocuments(userId);
    const selected = userDocs.filter(d => documentIds.includes(d.id));

    if (selected.length < 2) {
      throw new AppError('Select at least 2 valid documents to compare', 400);
    }

    const data = await this.postToAiService('/api/v1/compare', { documents: selected });
    return data;
  }

  public static async publicChat(shareToken: string, query: string, conversationId?: string) {
    const doc = await this.getPublicDocument(shareToken);
    const data = await this.postToAiService('/api/v1/query', {
      query,
      collection_name: doc.vectorCollectionId,
      conversation_id: conversationId || `public_${shareToken}`,
      top_k: 4,
    });
    return data;
  }
}
