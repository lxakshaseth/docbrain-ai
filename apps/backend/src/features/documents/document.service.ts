import path from 'path';
import crypto from 'crypto';
import { documentRepository } from '../../repositories/document.repository.js';
import { AppError } from '../../core/appError.js';
import { redisPublisher } from '../../redis/redisClient.js';
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

    // Publish ingestion task to Redis Pub/Sub channel for Python AI Service
    await redisPublisher.publish(REDIS_CHANNELS.DOC_INGEST_REQUEST, JSON.stringify(payload));

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

    // Re-publish ingestion task to Redis
    await redisPublisher.publish(REDIS_CHANNELS.DOC_INGEST_REQUEST, JSON.stringify(payload));

    return updatedDoc!.toJSON() as unknown as IDocument;
  }
}
