import { z } from 'zod';

export const resumeAnalyzeSchema = z.object({
  target_role: z.string().min(1).max(100).optional().default('Software Engineer'),
});

export type ResumeAnalyzeInput = z.infer<typeof resumeAnalyzeSchema>;
