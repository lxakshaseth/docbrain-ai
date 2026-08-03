import { Schema, model, Document as MongooseDocument } from 'mongoose';
import { IUser } from '@pdf-chatbot/shared';

export interface IUserDocument extends Omit<IUser, 'id'>, MongooseDocument {
  passwordHash: string;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    passwordHash: { type: String, required: true, select: false },
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

export const UserModel = model<IUserDocument>('User', userSchema);
