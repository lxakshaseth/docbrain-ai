import { MessageModel, IMessageEntity } from '../models/Message.js';
import { MessageSender, ISourceCitation } from '@pdf-chatbot/shared';

export class MessageRepository {
  public async create(data: {
    conversationId: string;
    sender: MessageSender;
    content: string;
    sources?: ISourceCitation[];
  }): Promise<IMessageEntity> {
    return MessageModel.create(data);
  }

  public async findByConversationId(conversationId: string): Promise<IMessageEntity[]> {
    return MessageModel.find({ conversationId }).sort({ createdAt: 1 });
  }

  public async deleteByConversationId(conversationId: string): Promise<number> {
    const res = await MessageModel.deleteMany({ conversationId });
    return res.deletedCount;
  }
}

export const messageRepository = new MessageRepository();
