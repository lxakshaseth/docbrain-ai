import { ConversationModel, IConversationEntity } from '../models/Conversation.js';

export class ConversationRepository {
  public async create(data: { userId: string; documentId: string; title: string }): Promise<IConversationEntity> {
    return ConversationModel.create(data);
  }

  public async findByUserId(userId: string): Promise<IConversationEntity[]> {
    return ConversationModel.find({ userId }).sort({ updatedAt: -1 });
  }

  public async findByIdAndUser(id: string, userId: string): Promise<IConversationEntity | null> {
    return ConversationModel.findOne({ _id: id, userId });
  }

  public async findByDocumentAndUser(documentId: string, userId: string): Promise<IConversationEntity | null> {
    return ConversationModel.findOne({ documentId, userId }).sort({ updatedAt: -1 });
  }

  public async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const res = await ConversationModel.deleteOne({ _id: id, userId });
    return res.deletedCount > 0;
  }
}

export const conversationRepository = new ConversationRepository();
