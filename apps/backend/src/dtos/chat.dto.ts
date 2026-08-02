import { z } from 'zod';

export const ChatQuerySchema = z.object({
  documentId: z.string().min(1, { message: 'Document ID is required' }),
  conversationId: z.string().optional(),
  query: z.string().min(1, { message: 'Query message text cannot be empty' }),
});

export const ChatHistoryQuerySchema = z.object({
  documentId: z.string().optional(),
  conversationId: z.string().optional(),
});

export type ChatQueryInput = z.infer<typeof ChatQuerySchema>;
export type ChatHistoryQueryInput = z.infer<typeof ChatHistoryQuerySchema>;
