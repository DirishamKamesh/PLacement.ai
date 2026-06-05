import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  institution: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string()).optional(),
  social_links: z.object({
    github: z.string().optional(),
    linkedin: z.string().optional(),
    twitter: z.string().optional(),
    website: z.string().optional(),
  }).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
