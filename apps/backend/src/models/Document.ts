import { Schema, model, Document as MongooseDocument } from 'mongoose';
import { IDocument } from '@pdf-chatbot/shared';

export interface IDocumentEntity extends Omit<IDocument, 'id'>, MongooseDocument {}

const documentSchema = new Schema<IDocumentEntity>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true, default: 'application/pdf' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    errorReason: { type: String },
    chunkCount: { type: Number, default: 0 },
    vectorCollectionId: { type: String, required: true },
    isPublicShare: { type: Boolean, default: false },
    shareToken: { type: String, index: true },
    summaryData: { type: Schema.Types.Mixed },
    studySetData: { type: Schema.Types.Mixed },
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

export const DocumentModel = model<IDocumentEntity>('Document', documentSchema);
