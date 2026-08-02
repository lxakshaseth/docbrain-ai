import { z } from 'zod';

export const DocumentParamSchema = z.object({
  id: z.string().min(1, { message: 'Document ID is required' }),
});

export type DocumentParamInput = z.infer<typeof DocumentParamSchema>;
