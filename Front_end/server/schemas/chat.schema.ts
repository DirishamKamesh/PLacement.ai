import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(10000),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.array(z.object({
      text: z.string(),
    })),
  })).optional().default([]),
  context: z.enum(['global', 'workspace', 'interview']).optional().default('global'),
});

export const saveConversationSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    parts: z.string(),
    timestamp: z.string().optional(),
  })),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
export type SaveConversationInput = z.infer<typeof saveConversationSchema>;
