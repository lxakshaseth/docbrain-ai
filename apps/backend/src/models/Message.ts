import { Schema, model, Document as MongooseDocument } from 'mongoose';
import { IMessage } from '@pdf-chatbot/shared';

export interface IMessageEntity extends Omit<IMessage, 'id'>, MongooseDocument {}

const messageSchema = new Schema<IMessageEntity>(
  {
    conversationId: { type: String, required: true, index: true },
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: [
      {
        pageNumber: { type: Number, required: true },
        snippet: { type: String, required: true },
        score: { type: Number, required: true },
      },
    ],
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

export const MessageModel = model<IMessageEntity>('Message', messageSchema);
