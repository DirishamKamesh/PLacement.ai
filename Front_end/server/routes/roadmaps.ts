import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createRoadmapSchema,
  updateRoadmapSchema,
  batchUpdateNodesSchema,
  batchUpdateEdgesSchema,
} from '../schemas/roadmap.schema.js';

const router = Router();

// All roadmap routes require authentication
router.use(authMiddleware);

// GET /api/roadmaps — List user's roadmaps
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data: roadmaps, error } = await supabaseAdmin
      .from('roadmaps')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch roadmaps' });
    }

    res.json({ roadmaps: roadmaps || [] });
  } catch (error: any) {
    console.error('List roadmaps error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/roadmaps/:id — Get roadmap with nodes and edges
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch roadmap
    const { data: roadmap, error: rmError } = await supabaseAdmin
      .from('roadmaps')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (rmError || !roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Fetch nodes
    const { data: nodes } = await supabaseAdmin
      .from('roadmap_nodes')
      .select('*')
      .eq('roadmap_id', id)
      .order('created_at', { ascending: true });

    // Fetch edges
    const { data: edges } = await supabaseAdmin
      .from('roadmap_edges')
      .select('*')
      .eq('roadmap_id', id);

    res.json({
      roadmap,
      nodes: nodes || [],
      edges: edges || [],
    });
  } catch (error: any) {
    console.error('Get roadmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/roadmaps — Create a new roadmap
router.post('/', validate(createRoadmapSchema), async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;

    const { data: roadmap, error } = await supabaseAdmin
      .from('roadmaps')
      .insert({
        user_id: req.user!.id,
        title,
        description: description || '',
        status: 'active',
        total_challenges: 0,
        completed_challenges: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Create roadmap error:', error);
      return res.status(500).json({ error: 'Failed to create roadmap' });
    }

    res.status(201).json({ roadmap });
  } catch (error: any) {
    console.error('Create roadmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/roadmaps/:id — Update roadmap metadata
router.put('/:id', validate(updateRoadmapSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: roadmap, error } = await supabaseAdmin
      .from('roadmaps')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update roadmap' });
    }

    res.json({ roadmap });
  } catch (error: any) {
    console.error('Update roadmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/roadmaps/:id — Delete a roadmap and all its nodes/edges
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: roadmap } = await supabaseAdmin
      .from('roadmaps')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Delete edges first (foreign key)
    await supabaseAdmin.from('roadmap_edges').delete().eq('roadmap_id', id);
    // Delete nodes
    await supabaseAdmin.from('roadmap_nodes').delete().eq('roadmap_id', id);
    // Delete roadmap
    await supabaseAdmin.from('roadmaps').delete().eq('id', id);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete roadmap error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/roadmaps/:id/nodes — Batch update nodes
router.put('/:id/nodes', validate(batchUpdateNodesSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nodes } = req.body;

    // Verify ownership
    const { data: roadmap } = await supabaseAdmin
      .from('roadmaps')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Upsert each node
    const results = [];
    for (const node of nodes) {
      const { id: nodeId, ...updates } = node;

      const { data, error } = await supabaseAdmin
        .from('roadmap_nodes')
        .upsert({
          id: nodeId,
          roadmap_id: id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (data) results.push(data);
      if (error) console.error('Node upsert error:', error);
    }

    // Recalculate roadmap totals
    const { data: allNodes } = await supabaseAdmin
      .from('roadmap_nodes')
      .select('total, solved, status')
      .eq('roadmap_id', id);

    if (allNodes) {
      const total = allNodes.reduce((sum, n) => sum + (n.total || 0), 0);
      const completed = allNodes.reduce((sum, n) => sum + (n.solved || 0), 0);
      
      await supabaseAdmin
        .from('roadmaps')
        .update({ total_challenges: total, completed_challenges: completed, updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    res.json({ nodes: results });
  } catch (error: any) {
    console.error('Batch update nodes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/roadmaps/:id/edges — Batch update edges
router.put('/:id/edges', validate(batchUpdateEdgesSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { edges } = req.body;

    // Verify ownership
    const { data: roadmap } = await supabaseAdmin
      .from('roadmaps')
      .select('id')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Delete existing edges for this roadmap and replace
    await supabaseAdmin.from('roadmap_edges').delete().eq('roadmap_id', id);

    const edgesWithRoadmap = edges.map((e: any) => ({
      ...e,
      roadmap_id: id,
    }));

    const { data, error } = await supabaseAdmin
      .from('roadmap_edges')
      .insert(edgesWithRoadmap)
      .select();

    if (error) {
      console.error('Batch edge update error:', error);
      return res.status(500).json({ error: 'Failed to update edges' });
    }

    res.json({ edges: data || [] });
  } catch (error: any) {
    console.error('Batch update edges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
