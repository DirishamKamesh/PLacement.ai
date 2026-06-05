import { z } from 'zod';

export const createRoadmapSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
});

export const updateRoadmapSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
});

export const batchUpdateNodesSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    node_type: z.enum(['topic', 'challenge', 'project', 'milestone']).optional(),
    title: z.string().max(200).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(['locked', 'in-progress', 'completed']).optional(),
    solved: z.number().int().min(0).optional(),
    total: z.number().int().min(0).optional(),
    label: z.string().max(200).optional(),
    position_x: z.number().optional(),
    position_y: z.number().optional(),
    data: z.record(z.unknown()).optional(),
  })),
});

export const batchUpdateEdgesSchema = z.object({
  edges: z.array(z.object({
    id: z.string(),
    source_node_id: z.string(),
    target_node_id: z.string(),
    animated: z.boolean().optional(),
    style: z.record(z.unknown()).optional(),
  })),
});

export type CreateRoadmapInput = z.infer<typeof createRoadmapSchema>;
export type UpdateRoadmapInput = z.infer<typeof updateRoadmapSchema>;
export type BatchUpdateNodesInput = z.infer<typeof batchUpdateNodesSchema>;
export type BatchUpdateEdgesInput = z.infer<typeof batchUpdateEdgesSchema>;
