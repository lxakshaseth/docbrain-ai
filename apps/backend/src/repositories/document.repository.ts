import { DocumentModel, IDocumentEntity } from '../models/Document.js';
import { DocumentStatus } from '@pdf-chatbot/shared';

export class DocumentRepository {
  public async create(data: Partial<IDocumentEntity>): Promise<IDocumentEntity> {
    return DocumentModel.create(data);
  }

  public async findByUserId(userId: string): Promise<IDocumentEntity[]> {
    return DocumentModel.find({ userId }).sort({ createdAt: -1 });
  }

  public async findByIdAndUser(id: string, userId: string): Promise<IDocumentEntity | null> {
    return DocumentModel.findOne({ _id: id, userId });
  }

  public async findById(id: string): Promise<IDocumentEntity | null> {
    return DocumentModel.findById(id);
  }

  public async updateStatus(
    id: string,
    status: DocumentStatus,
    chunkCount: number = 0,
    errorReason?: string
  ): Promise<IDocumentEntity | null> {
    return DocumentModel.findByIdAndUpdate(
      id,
      { status, chunkCount, errorReason },
      { new: true }
    );
  }

  public async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const res = await DocumentModel.deleteOne({ _id: id, userId });
    return res.deletedCount > 0;
  }
}

export const documentRepository = new DocumentRepository();
