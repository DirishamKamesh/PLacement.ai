import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// All template routes require authentication
router.use(authMiddleware);

// GET /api/roadmaps/templates — List all public templates with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, difficulty, search } = req.query;

    let query = supabaseAdmin
      .from('roadmap_templates')
      .select('*')
      .eq('is_public', true);

    if (category) {
      query = query.eq('category', category);
    }
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: templates, error } = await query.order('likes_count', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }

    // Load liked and bookmarked status for current user
    const { data: likes } = await supabaseAdmin
      .from('roadmap_likes')
      .select('template_id')
      .eq('user_id', req.user!.id);
      
    const { data: bookmarks } = await supabaseAdmin
      .from('roadmap_bookmarks')
      .select('template_id')
      .eq('user_id', req.user!.id);

    const likedIds = new Set((likes || []).map(l => l.template_id));
    const bookmarkedIds = new Set((bookmarks || []).map(b => b.template_id));

    const enrichedTemplates = templates.map((t: any) => ({
      ...t,
      liked: likedIds.has(t.id),
      bookmarked: bookmarkedIds.has(t.id)
    }));

    res.json({ templates: enrichedTemplates });
  } catch (error: any) {
    console.error('List templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/roadmaps/templates/:id — Get template details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: template, error: tError } = await supabaseAdmin
      .from('roadmap_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (tError || !template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { data: nodes } = await supabaseAdmin
      .from('roadmap_template_nodes')
      .select('*')
      .eq('template_id', id);

    const { data: edges } = await supabaseAdmin
      .from('roadmap_template_edges')
      .select('*')
      .eq('template_id', id);

    res.json({
      template,
      nodes: nodes || [],
      edges: edges || []
    });
  } catch (error: any) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/roadmaps/templates/:id/clone — Duplicate template to workspace
router.post('/:id/clone', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch template
    const { data: template, error: tError } = await supabaseAdmin
      .from('roadmap_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (tError || !template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Fetch template components
    const { data: tempNodes } = await supabaseAdmin
      .from('roadmap_template_nodes')
      .select('*')
      .eq('template_id', id);

    const { data: tempEdges } = await supabaseAdmin
      .from('roadmap_template_edges')
      .select('*')
      .eq('template_id', id);

    // 1. Create personal roadmap
    const { data: newRoadmap, error: newRmError } = await supabaseAdmin
      .from('roadmaps')
      .insert({
        user_id: req.user!.id,
        title: template.title,
        description: template.description,
        status: 'active'
      })
      .select()
      .single();

    if (newRmError) throw newRmError;

    // 2. Duplicate nodes (keep track of mapped IDs for edge links)
    const nodeMapping: Record<string, string> = {};
    const nodesToInsert = (tempNodes || []).map((tn: any) => {
      const newId = crypto.randomUUID();
      nodeMapping[tn.id] = newId;
      return {
        id: newId,
        roadmap_id: newRoadmap.id,
        node_type: tn.node_type,
        title: tn.title,
        description: tn.description,
        status: 'locked', // resets progress to locked on clone
        solved: 0,
        total: tn.total,
        label: tn.label,
        position_x: tn.position_x,
        position_y: tn.position_y,
        data: tn.data
      };
    });

    if (nodesToInsert.length > 0) {
      const { error: nodesInsertError } = await supabaseAdmin
        .from('roadmap_nodes')
        .insert(nodesToInsert);
      if (nodesInsertError) throw nodesInsertError;
    }

    // 3. Duplicate edges linking mapped IDs
    const edgesToInsert = (tempEdges || []).map((te: any) => {
      // Map the string node IDs to the new UUIDs
      const sourceId = nodeMapping[te.source_node_id] || te.source_node_id;
      const targetId = nodeMapping[te.target_node_id] || te.target_node_id;
      return {
        roadmap_id: newRoadmap.id,
        source_node_id: sourceId,
        target_node_id: targetId,
        animated: te.animated,
        style: te.style
      };
    });

    if (edgesToInsert.length > 0) {
      const { error: edgesInsertError } = await supabaseAdmin
        .from('roadmap_edges')
        .insert(edgesToInsert);
      if (edgesInsertError) throw edgesInsertError;
    }

    // 4. Update stats: increment template clone count
    await supabaseAdmin
      .from('roadmap_templates')
      .update({ clones_count: (template.clones_count || 0) + 1 })
      .eq('id', id);

    // 5. Save cloning event history link
    await supabaseAdmin
      .from('roadmap_clones')
      .insert({
        template_id: id,
        user_id: req.user!.id,
        cloned_roadmap_id: newRoadmap.id
      });

    res.status(201).json({ cloned_roadmap: newRoadmap });
  } catch (error: any) {
    console.error('Clone template error:', error);
    res.status(500).json({ error: error.message || 'Cloning failed' });
  }
});

// POST /api/roadmaps/templates/:id/like — Toggle likes
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if liked
    const { data: liked, error: fetchLikeError } = await supabaseAdmin
      .from('roadmap_likes')
      .select('*')
      .eq('template_id', id)
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (fetchLikeError) throw fetchLikeError;

    // Fetch template details to modify counter
    const { data: template } = await supabaseAdmin
      .from('roadmap_templates')
      .select('likes_count')
      .eq('id', id)
      .single();

    let likesCount = template?.likes_count || 0;

    if (liked) {
      // Unlike
      await supabaseAdmin
        .from('roadmap_likes')
        .delete()
        .eq('template_id', id)
        .eq('user_id', req.user!.id);
      
      likesCount = Math.max(0, likesCount - 1);
      await supabaseAdmin.from('roadmap_templates').update({ likes_count: likesCount }).eq('id', id);
      return res.json({ liked: false, likes_count: likesCount });
    } else {
      // Like
      await supabaseAdmin
        .from('roadmap_likes')
        .insert({ template_id: id, user_id: req.user!.id });

      likesCount += 1;
      await supabaseAdmin.from('roadmap_templates').update({ likes_count: likesCount }).eq('id', id);
      return res.json({ liked: true, likes_count: likesCount });
    }
  } catch (error: any) {
    console.error('Like template error:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// POST /api/roadmaps/templates/:id/bookmark — Toggle bookmarks
router.post('/:id/bookmark', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if bookmarked
    const { data: bookmarked, error: fetchBkError } = await supabaseAdmin
      .from('roadmap_bookmarks')
      .select('*')
      .eq('template_id', id)
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (fetchBkError) throw fetchBkError;

    if (bookmarked) {
      // Remove bookmark
      await supabaseAdmin
        .from('roadmap_bookmarks')
        .delete()
        .eq('template_id', id)
        .eq('user_id', req.user!.id);
      return res.json({ bookmarked: false });
    } else {
      // Add bookmark
      await supabaseAdmin
        .from('roadmap_bookmarks')
        .insert({ template_id: id, user_id: req.user!.id });
      return res.json({ bookmarked: true });
    }
  } catch (error: any) {
    console.error('Bookmark template error:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
});

export default router;
