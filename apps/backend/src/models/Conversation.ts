import { Schema, model, Document as MongooseDocument } from 'mongoose';
import { IConversation } from '@pdf-chatbot/shared';

export interface IConversationEntity extends Omit<IConversation, 'id'>, MongooseDocument {}

const conversationSchema = new Schema<IConversationEntity>(
  {
    userId: { type: String, required: true, index: true },
    documentId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: 'New Conversation' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, any>;
        obj.id = obj._id.toString();
        delete obj._id;
        delete obj.__v;
      },
    },
  }
);

export const ConversationModel = model<IConversationEntity>('Conversation', conversationSchema);
