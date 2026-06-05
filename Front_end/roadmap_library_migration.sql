-- ============================================================
-- PlaceMentor AI — Phase 2: Roadmap Library Migration & Seeds
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── 1. Create Tables ─────────────────────────────────────────

-- Roadmap Templates Table
CREATE TABLE IF NOT EXISTS public.roadmap_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK (category IN ('DSA', 'Frontend', 'Backend', 'AI / ML', 'Development', 'Placement')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  estimated_hours INTEGER DEFAULT 0,
  tags JSONB DEFAULT '[]'::jsonb,
  author TEXT DEFAULT 'System Admin',
  version TEXT DEFAULT '1.0.0',
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  is_public BOOLEAN DEFAULT true, -- Deprecated in favor of visibility, kept for API compat
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_beginner_friendly BOOLEAN DEFAULT false,
  is_advanced BOOLEAN DEFAULT false,
  clones_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Template Nodes Table
CREATE TABLE IF NOT EXISTS public.roadmap_template_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.roadmap_templates(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL DEFAULT 'topic' CHECK (node_type IN ('topic', 'challenge', 'project', 'milestone')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  total INTEGER DEFAULT 0,
  label TEXT DEFAULT '',
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Template Edges Table
CREATE TABLE IF NOT EXISTS public.roadmap_template_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.roadmap_templates(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  animated BOOLEAN DEFAULT false,
  style JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Roadmap Clones Table (Links Template and personal Cloned Roadmap)
CREATE TABLE IF NOT EXISTS public.roadmap_clones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.roadmap_templates(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cloned_roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  cloned_at TIMESTAMPTZ DEFAULT now()
);

-- Roadmap Likes Table (Junction)
CREATE TABLE IF NOT EXISTS public.roadmap_likes (
  template_id UUID NOT NULL REFERENCES public.roadmap_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, user_id)
);

-- Roadmap Bookmarks Table (Junction)
CREATE TABLE IF NOT EXISTS public.roadmap_bookmarks (
  template_id UUID NOT NULL REFERENCES public.roadmap_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, user_id)
);


-- ── 2. Add visibility column to personal roadmaps table ──────
ALTER TABLE public.roadmaps ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'unlisted'));


-- ── 3. Create Indexes ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_template_nodes_template ON public.roadmap_template_nodes(template_id);
CREATE INDEX IF NOT EXISTS idx_template_edges_template ON public.roadmap_template_edges(template_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_clones_user ON public.roadmap_clones(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_likes_user ON public.roadmap_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_bookmarks_user ON public.roadmap_bookmarks(user_id);


-- ── 4. Enable & Configure RLS Policies ────────────────────────

ALTER TABLE public.roadmap_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_template_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_template_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_clones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_bookmarks ENABLE ROW LEVEL SECURITY;

-- Templates (Public can read public/unlisted, only admin can write)
CREATE POLICY "Public can view templates" ON public.roadmap_templates
  FOR SELECT USING (visibility = 'public' OR visibility = 'unlisted');
CREATE POLICY "Admin write templates" ON public.roadmap_templates
  FOR ALL USING (true); -- Service role bypasses RLS implicitly

-- Template Nodes (Public read, admin write)
CREATE POLICY "Public can view template nodes" ON public.roadmap_template_nodes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.roadmap_templates WHERE id = template_id AND (visibility = 'public' OR visibility = 'unlisted'))
  );
CREATE POLICY "Admin write template nodes" ON public.roadmap_template_nodes
  FOR ALL USING (true);

-- Template Edges (Public read, admin write)
CREATE POLICY "Public can view template edges" ON public.roadmap_template_edges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.roadmap_templates WHERE id = template_id AND (visibility = 'public' OR visibility = 'unlisted'))
  );
CREATE POLICY "Admin write template edges" ON public.roadmap_template_edges
  FOR ALL USING (true);

-- Clones (User can view/manage own clones)
CREATE POLICY "Users can select own clones" ON public.roadmap_clones
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own clones" ON public.roadmap_clones
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Likes (User can view/manage own likes)
CREATE POLICY "Users can view own likes" ON public.roadmap_likes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own likes" ON public.roadmap_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.roadmap_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Bookmarks (User can view/manage own bookmarks)
CREATE POLICY "Users can view own bookmarks" ON public.roadmap_bookmarks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookmarks" ON public.roadmap_bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.roadmap_bookmarks
  FOR DELETE USING (auth.uid() = user_id);

-- Add policy to allow public roadmap viewing
DROP POLICY IF EXISTS "Anyone can view public or unlisted roadmaps" ON public.roadmaps;
CREATE POLICY "Anyone can view public or unlisted roadmaps" ON public.roadmaps
  FOR SELECT USING (visibility = 'public' OR visibility = 'unlisted' OR auth.uid() = user_id);


-- ── 5. Seed Templates Data ──────────────────────────────────────

-- Seeding template: NeetCode 150
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'NeetCode 150',
  'The standard 150 curated LeetCode problems covering all major data structures and algorithmic patterns required for top tech interviews.',
  'DSA',
  'Advanced',
  150,
  '["DSA","LeetCode","Interview Prep","NeetCode"]'::jsonb,
  'public',
  true,
  true,
  true,
  false,
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'd0000000-0000-0000-0000-000000000001';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'd0000000-0000-0000-0000-000000000001';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('37351d2d-1cec-6823-f4ad-111911e19030', 'd0000000-0000-0000-0000-000000000001', 'topic', 'Arrays & Hashing', 'Contains Duplicate, Valid Anagram, Two Sum, Group Anagrams, Top K Frequent.', 9, 'STEP 1', 200, 100),
  ('8170ff52-aebe-6123-0649-51fa4968f187', 'd0000000-0000-0000-0000-000000000001', 'topic', 'Two Pointers & Sliding Window', 'Valid Palindrome, Two Sum II, 3Sum, Container with Most Water, Best Time to Buy/Sell Stock.', 9, 'STEP 2', 400, 200),
  ('3e2fd951-66ed-6f5c-6881-61ff53dcf087', 'd0000000-0000-0000-0000-000000000001', 'topic', 'Stack & Binary Search', 'Valid Parentheses, Min Stack, Evaluate Reverse Polish Notation, Search in Rotated Sorted Array.', 10, 'STEP 3', 200, 350),
  ('4a0e6544-e84b-b729-231e-43d703e81775', 'd0000000-0000-0000-0000-000000000001', 'topic', 'Linked List & Trees', 'Reverse Linked List, Merge Two Lists, Binary Tree Maximum Path Sum, Serialize/Deserialize Tree.', 21, 'STEP 4', 400, 450),
  ('ee8561af-d1c3-836b-38b0-f5260945f3a8', 'd0000000-0000-0000-0000-000000000001', 'topic', 'Backtracking & Graphs', 'Subsets, Combination Sum, Word Search, Number of Islands, Clone Graph, Course Schedule.', 15, 'STEP 5', 200, 600),
  ('f5e0b8e4-5731-d1d2-5e5f-6e663e703e32', 'd0000000-0000-0000-0000-000000000001', 'milestone', 'Dynamic Programming & Greedy', 'Climbing Stairs, House Robber, Longest Common Subsequence, Edit Distance.', 20, 'FINALE', 300, 750);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('d0000000-0000-0000-0000-000000000001', '37351d2d-1cec-6823-f4ad-111911e19030', '8170ff52-aebe-6123-0649-51fa4968f187', true),
  ('d0000000-0000-0000-0000-000000000001', '8170ff52-aebe-6123-0649-51fa4968f187', '3e2fd951-66ed-6f5c-6881-61ff53dcf087', false),
  ('d0000000-0000-0000-0000-000000000001', '3e2fd951-66ed-6f5c-6881-61ff53dcf087', '4a0e6544-e84b-b729-231e-43d703e81775', true),
  ('d0000000-0000-0000-0000-000000000001', '4a0e6544-e84b-b729-231e-43d703e81775', 'ee8561af-d1c3-836b-38b0-f5260945f3a8', false),
  ('d0000000-0000-0000-0000-000000000001', 'ee8561af-d1c3-836b-38b0-f5260945f3a8', 'f5e0b8e4-5731-d1d2-5e5f-6e663e703e32', true);

-- Seeding template: Blind 75
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'd0000000-0000-0000-0000-000000000002',
  'Blind 75',
  'The legendary subset of LeetCode questions focusing on core conceptual patterns needed to crack coding interviews.',
  'DSA',
  'Intermediate',
  80,
  '["DSA","LeetCode","Fast Track"]'::jsonb,
  'public',
  true,
  false,
  true,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'd0000000-0000-0000-0000-000000000002';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'd0000000-0000-0000-0000-000000000002';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('4e3ae185-448e-88ed-10ed-ca4175d32a3d', 'd0000000-0000-0000-0000-000000000002', 'topic', 'Arrays & Matrices', 'Two Sum, Best Time to Buy/Sell Stock, Product of Array Except Self, Maximum Subarray.', 12, 'WEEK 1', 250, 100),
  ('08070886-92ad-fbfb-6a5e-34903ff600a0', 'd0000000-0000-0000-0000-000000000002', 'topic', 'Strings & Linked Lists', 'Longest Substring Without Repeating Characters, Reverse Linked List, Merge k Sorted Lists.', 15, 'WEEK 2', 450, 200),
  ('ba02d67e-b348-b3b6-7e1c-a796aed7d88e', 'd0000000-0000-0000-0000-000000000002', 'topic', 'Trees & Heap', 'Invert Binary Tree, Maximum Depth, Binary Tree Level Order Traversal, Merge K Sorted Lists.', 18, 'WEEK 3', 250, 350),
  ('d2f280e4-ff41-01a5-cb11-fdb75b8e45ef', 'd0000000-0000-0000-0000-000000000002', 'milestone', 'DP & Graphs', 'Climbing Stairs, Coin Change, Longest Increasing Subsequence, Course Schedule.', 20, 'WEEK 4', 350, 500);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('d0000000-0000-0000-0000-000000000002', '4e3ae185-448e-88ed-10ed-ca4175d32a3d', '08070886-92ad-fbfb-6a5e-34903ff600a0', true),
  ('d0000000-0000-0000-0000-000000000002', '08070886-92ad-fbfb-6a5e-34903ff600a0', 'ba02d67e-b348-b3b6-7e1c-a796aed7d88e', false),
  ('d0000000-0000-0000-0000-000000000002', 'ba02d67e-b348-b3b6-7e1c-a796aed7d88e', 'd2f280e4-ff41-01a5-cb11-fdb75b8e45ef', true);

-- Seeding template: Striver A2Z
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'd0000000-0000-0000-0000-000000000003',
  'Striver A2Z',
  'Highly exhaustive DSA roadmap guiding you from complete basics up to advanced graph algorithms and heavy dynamic programming.',
  'DSA',
  'Advanced',
  250,
  '["DSA","Striver","Comprehensive","SDE Sheet"]'::jsonb,
  'public',
  true,
  false,
  false,
  false,
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'd0000000-0000-0000-0000-000000000003';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'd0000000-0000-0000-0000-000000000003';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('4c726ca5-5885-488d-67b1-f1462b73703c', 'd0000000-0000-0000-0000-000000000003', 'topic', 'Basics & Sorting', 'Time/Space complexity, patterns, basic recursion, bubble/selection/insertion sort.', 25, 'PHASE 1', 200, 100),
  ('6f89c544-fbc2-cda0-cebf-e9ec622657c1', 'd0000000-0000-0000-0000-000000000003', 'topic', 'Arrays & Binary Search', 'Subarrays, sliding window, searching in 1D and 2D arrays, boundary checks.', 45, 'PHASE 2', 400, 200),
  ('c10dded1-7827-f9c8-043c-ae187119fe7e', 'd0000000-0000-0000-0000-000000000003', 'topic', 'Stack, Queue & Linked List', 'Implementations, DLL, circular lists, next greater element, LRU Cache.', 35, 'PHASE 3', 200, 350),
  ('36069328-9d9f-1706-84df-f689d1b03bea', 'd0000000-0000-0000-0000-000000000003', 'topic', 'Greedy & Recursion', 'Huffman coding, fractional knapsack, N-queens, subset sums, sudoku solver.', 30, 'PHASE 4', 400, 450),
  ('82fccc43-294f-897f-577a-82aa5692a079', 'd0000000-0000-0000-0000-000000000003', 'topic', 'Trees & Graphs', 'Traversals, height, LCA, Dijkstra, Bellman Ford, MST, Disjoint Set.', 50, 'PHASE 5', 200, 600),
  ('56d5a386-2fb8-a31e-047f-d23d09e7db83', 'd0000000-0000-0000-0000-000000000003', 'milestone', 'Dynamic Programming & Tries', 'Grid DP, MCM, digit DP, tree DP, trie insert/search.', 45, 'FINALE', 300, 750);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('d0000000-0000-0000-0000-000000000003', '4c726ca5-5885-488d-67b1-f1462b73703c', '6f89c544-fbc2-cda0-cebf-e9ec622657c1', true),
  ('d0000000-0000-0000-0000-000000000003', '6f89c544-fbc2-cda0-cebf-e9ec622657c1', 'c10dded1-7827-f9c8-043c-ae187119fe7e', false),
  ('d0000000-0000-0000-0000-000000000003', 'c10dded1-7827-f9c8-043c-ae187119fe7e', '36069328-9d9f-1706-84df-f689d1b03bea', true),
  ('d0000000-0000-0000-0000-000000000003', '36069328-9d9f-1706-84df-f689d1b03bea', '82fccc43-294f-897f-577a-82aa5692a079', false),
  ('d0000000-0000-0000-0000-000000000003', '82fccc43-294f-897f-577a-82aa5692a079', '56d5a386-2fb8-a31e-047f-d23d09e7db83', true);

-- Seeding template: HTML
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'f0000000-0000-0000-0000-000000000001',
  'HTML',
  'Learn the backbone of visual document markup, semantic structuring, basic form controls, and web accessibility standards.',
  'Frontend',
  'Beginner',
  15,
  '["HTML","Web Basics","Frontend"]'::jsonb,
  'public',
  true,
  false,
  false,
  true,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'f0000000-0000-0000-0000-000000000001';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'f0000000-0000-0000-0000-000000000001';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('9d36baeb-edeb-95ee-fdad-47d118c5ac53', 'f0000000-0000-0000-0000-000000000001', 'topic', 'Document Structure', 'Tags, doctype, head, body, meta description, formatting syntax.', 6, 'DAY 1', 250, 100),
  ('3bfd0e44-221e-7fd2-466f-1d9826c33144', 'f0000000-0000-0000-0000-000000000001', 'topic', 'Semantic Elements', 'header, footer, nav, article, section, aside, semantic SEO values.', 8, 'DAY 2', 450, 200),
  ('50357d07-c94f-21be-26c0-9fc4929b3ae3', 'f0000000-0000-0000-0000-000000000001', 'milestone', 'Forms & Accessibility', 'Forms, label validation, aria attributes, input types, semantic buttons.', 10, 'DAY 3', 350, 350);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('f0000000-0000-0000-0000-000000000001', '9d36baeb-edeb-95ee-fdad-47d118c5ac53', '3bfd0e44-221e-7fd2-466f-1d9826c33144', true),
  ('f0000000-0000-0000-0000-000000000001', '3bfd0e44-221e-7fd2-466f-1d9826c33144', '50357d07-c94f-21be-26c0-9fc4929b3ae3', true);

-- Seeding template: CSS
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'f0000000-0000-0000-0000-000000000002',
  'CSS',
  'Master style rules, CSS layout systems (Flexbox and Grid), responsive design patterns, custom variables, and transitions.',
  'Frontend',
  'Beginner',
  25,
  '["CSS","Styling","UI Design"]'::jsonb,
  'public',
  true,
  false,
  false,
  true,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'f0000000-0000-0000-0000-000000000002';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'f0000000-0000-0000-0000-000000000002';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('6ad8bf36-0a88-75cf-ccbf-eb794f5b0822', 'f0000000-0000-0000-0000-000000000002', 'topic', 'Selectors & Box Model', 'Class, ID selectors, margins, borders, padding, sizing models.', 10, 'STEP 1', 200, 100),
  ('aadeeff5-3056-8f93-8a87-de7db32bac3b', 'f0000000-0000-0000-0000-000000000002', 'topic', 'Layouts: Flex & Grid', 'Flex direction, alignment, grid templates, grid areas, auto-fit/fill properties.', 12, 'STEP 2', 400, 200),
  ('6b526dcb-74a9-2ef8-e152-b452937c2e60', 'f0000000-0000-0000-0000-000000000002', 'milestone', 'Animations & Responsiveness', 'Media queries, keyframes, transitions, custom properties, styling targets.', 8, 'STEP 3', 300, 350);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('f0000000-0000-0000-0000-000000000002', '6ad8bf36-0a88-75cf-ccbf-eb794f5b0822', 'aadeeff5-3056-8f93-8a87-de7db32bac3b', true),
  ('f0000000-0000-0000-0000-000000000002', 'aadeeff5-3056-8f93-8a87-de7db32bac3b', '6b526dcb-74a9-2ef8-e152-b452937c2e60', true);

-- Seeding template: JavaScript
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'f0000000-0000-0000-0000-000000000003',
  'JavaScript',
  'Deep dive into modern ECMAScript features, DOM manipulation, asynchronous programming, APIs fetching, and scope behavior.',
  'Frontend',
  'Beginner',
  40,
  '["JS","JavaScript","Programming Core"]'::jsonb,
  'public',
  true,
  false,
  false,
  true,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'f0000000-0000-0000-0000-000000000003';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'f0000000-0000-0000-0000-000000000003';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('cb9269fe-5249-6900-7cca-6cd754a0f155', 'f0000000-0000-0000-0000-000000000003', 'topic', 'Syntax & Fundamentals', 'Variables, loops, functions, array methods, scoping and closures.', 12, 'PART 1', 200, 100),
  ('d240eca2-9c02-4be2-b77f-3dcef48f9e0a', 'f0000000-0000-0000-0000-000000000003', 'topic', 'DOM & Event Loop', 'Selecting elements, adding listeners, bubble vs capture, event delegation.', 10, 'PART 2', 400, 200),
  ('584466b4-cb91-b212-2b8e-62abdf42cf91', 'f0000000-0000-0000-0000-000000000003', 'topic', 'Async JavaScript', 'Promises, Async/Await, Fetch API, error handling, try/catch structures.', 8, 'PART 3', 200, 350),
  ('5504077b-1d87-2095-f989-21b4497801bc', 'f0000000-0000-0000-0000-000000000003', 'milestone', 'ES6+ Features & Modules', 'Destructuring, spread operator, modules (import/export), classes.', 10, 'FINALE', 300, 480);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('f0000000-0000-0000-0000-000000000003', 'cb9269fe-5249-6900-7cca-6cd754a0f155', 'd240eca2-9c02-4be2-b77f-3dcef48f9e0a', true),
  ('f0000000-0000-0000-0000-000000000003', 'd240eca2-9c02-4be2-b77f-3dcef48f9e0a', '584466b4-cb91-b212-2b8e-62abdf42cf91', false),
  ('f0000000-0000-0000-0000-000000000003', '584466b4-cb91-b212-2b8e-62abdf42cf91', '5504077b-1d87-2095-f989-21b4497801bc', true);

-- Seeding template: React
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'f0000000-0000-0000-0000-000000000004',
  'React',
  'Build robust single-page applications using functional components, state hooks, routers, effects, and local storage state binding.',
  'Frontend',
  'Intermediate',
  50,
  '["React","Frontend Framework","JSX"]'::jsonb,
  'public',
  true,
  true,
  false,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'f0000000-0000-0000-0000-000000000004';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'f0000000-0000-0000-0000-000000000004';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('c8b68351-5793-10a9-4152-ed0d7244bb6d', 'f0000000-0000-0000-0000-000000000004', 'topic', 'Components & Props', 'JSX syntax, components architecture, props rendering, lists keys.', 8, 'PHASE 1', 200, 100),
  ('7fa780b9-cab9-28e1-ca40-bd54164bdac9', 'f0000000-0000-0000-0000-000000000004', 'topic', 'Hooks: State & Effects', 'useState, useEffect, custom hooks, form handling, input mapping.', 15, 'PHASE 2', 400, 200),
  ('69c2907a-98b1-df39-e64d-34e0be72d5c3', 'f0000000-0000-0000-0000-000000000004', 'topic', 'Context & Routing', 'useContext, router hooks, outlet layouts, protected route logic.', 10, 'PHASE 3', 200, 350),
  ('79e8e65a-ee6a-b723-93b1-3fb9610075bd', 'f0000000-0000-0000-0000-000000000004', 'milestone', 'Zustand & Performance', 'State stores, memoization (useMemo, useCallback), bundle optimization.', 8, 'PHASE 4', 300, 480);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('f0000000-0000-0000-0000-000000000004', 'c8b68351-5793-10a9-4152-ed0d7244bb6d', '7fa780b9-cab9-28e1-ca40-bd54164bdac9', true),
  ('f0000000-0000-0000-0000-000000000004', '7fa780b9-cab9-28e1-ca40-bd54164bdac9', '69c2907a-98b1-df39-e64d-34e0be72d5c3', false),
  ('f0000000-0000-0000-0000-000000000004', '69c2907a-98b1-df39-e64d-34e0be72d5c3', '79e8e65a-ee6a-b723-93b1-3fb9610075bd', true);

-- Seeding template: Next.js
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'f0000000-0000-0000-0000-000000000005',
  'Next.js',
  'Learn SEO-friendly React frameworks supporting Server Side Rendering, App Router navigation, static generation, and Server Actions.',
  'Frontend',
  'Advanced',
  45,
  '["Next.js","SSR","App Router","React"]'::jsonb,
  'public',
  true,
  false,
  true,
  false,
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'f0000000-0000-0000-0000-000000000005';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'f0000000-0000-0000-0000-000000000005';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('7fd6e23f-4d57-d86c-1d75-5f5d13e495b8', 'f0000000-0000-0000-0000-000000000005', 'topic', 'App Routing & Layouts', 'Folder based routes, nested layouts, loading/error pages, route groups.', 8, 'STEP 1', 250, 100),
  ('a8bd7afe-450a-c162-36e5-46617ea82ac8', 'f0000000-0000-0000-0000-000000000005', 'topic', 'Server Components vs Client', 'Hydration boundaries, fetching inside Server Components, use client directives.', 10, 'STEP 2', 450, 200),
  ('9eb04167-897e-5313-c73e-5c0ed8bd0b44', 'f0000000-0000-0000-0000-000000000005', 'topic', 'Server Actions & API Routes', 'Form submissions, mutation actions, revalidation tags, next/headers.', 8, 'STEP 3', 250, 350),
  ('113c9f0b-30f6-78dc-0ae5-775d0089a0ee', 'f0000000-0000-0000-0000-000000000005', 'milestone', 'Optimization & Deploying', 'next/image, next/font, metadata tags config, deploying on Vercel.', 6, 'STEP 4', 350, 480);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('f0000000-0000-0000-0000-000000000005', '7fd6e23f-4d57-d86c-1d75-5f5d13e495b8', 'a8bd7afe-450a-c162-36e5-46617ea82ac8', true),
  ('f0000000-0000-0000-0000-000000000005', 'a8bd7afe-450a-c162-36e5-46617ea82ac8', '9eb04167-897e-5313-c73e-5c0ed8bd0b44', false),
  ('f0000000-0000-0000-0000-000000000005', '9eb04167-897e-5313-c73e-5c0ed8bd0b44', '113c9f0b-30f6-78dc-0ae5-775d0089a0ee', true);

-- Seeding template: Node.js
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'Node.js',
  'Learn server-side JavaScript: runtimes, the event loop, file systems, streams, buffers, and package management systems.',
  'Backend',
  'Intermediate',
  35,
  '["Node.js","Runtime","Backend core"]'::jsonb,
  'public',
  true,
  false,
  false,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'b0000000-0000-0000-0000-000000000001';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'b0000000-0000-0000-0000-000000000001';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('5256c37d-2fd3-c6ef-b9d7-49b069bfdc91', 'b0000000-0000-0000-0000-000000000001', 'topic', 'Node Architecture', 'V8 engine, Libuv, asynchronous event loop thread pool model.', 5, 'WEEK 1', 200, 100),
  ('bf724ae8-66a1-3ed4-2c87-b7f59b1f623a', 'b0000000-0000-0000-0000-000000000001', 'topic', 'File System & Streams', 'FS module, buffers, pipe streams, readable/writable structures.', 8, 'WEEK 2', 400, 200),
  ('a2db300e-e036-19b2-52d2-a5028272e7ea', 'b0000000-0000-0000-0000-000000000001', 'milestone', 'HTTP Module & Package', 'Creating server sockets, parsing requests, managing package.json dependencies.', 7, 'WEEK 3', 300, 320);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('b0000000-0000-0000-0000-000000000001', '5256c37d-2fd3-c6ef-b9d7-49b069bfdc91', 'bf724ae8-66a1-3ed4-2c87-b7f59b1f623a', true),
  ('b0000000-0000-0000-0000-000000000001', 'bf724ae8-66a1-3ed4-2c87-b7f59b1f623a', 'a2db300e-e036-19b2-52d2-a5028272e7ea', true);

-- Seeding template: Express
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'b0000000-0000-0000-0000-000000000002',
  'Express',
  'Build resilient REST APIs using route declarations, middleware stack sequencing, CORS config, and dynamic error handlers.',
  'Backend',
  'Intermediate',
  30,
  '["Express","Express.js","REST API"]'::jsonb,
  'public',
  true,
  false,
  false,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'b0000000-0000-0000-0000-000000000002';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'b0000000-0000-0000-0000-000000000002';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('6bab051b-eb2f-bcb1-ef61-77b7851d6fbd', 'b0000000-0000-0000-0000-000000000002', 'topic', 'Router & HTTP Methods', 'GET, POST, PUT, DELETE mappings, request params, query strings.', 8, 'STEP 1', 200, 100),
  ('bbedff42-e129-d696-2b4d-288c2a87dc0e', 'b0000000-0000-0000-0000-000000000002', 'topic', 'Middleware Chains', 'Custom middleware, cors, body-parser, rate limit configurations.', 10, 'STEP 2', 400, 200),
  ('f32d73b2-a0ff-fd54-2ff0-939adf223ab5', 'b0000000-0000-0000-0000-000000000002', 'milestone', 'Controllers & Errors', 'MVC structure routing, global error interceptors, async handling.', 8, 'STEP 3', 300, 320);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('b0000000-0000-0000-0000-000000000002', '6bab051b-eb2f-bcb1-ef61-77b7851d6fbd', 'bbedff42-e129-d696-2b4d-288c2a87dc0e', true),
  ('b0000000-0000-0000-0000-000000000002', 'bbedff42-e129-d696-2b4d-288c2a87dc0e', 'f32d73b2-a0ff-fd54-2ff0-939adf223ab5', true);

-- Seeding template: PostgreSQL
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'b0000000-0000-0000-0000-000000000003',
  'PostgreSQL',
  'Learn relational database administration, indexes creation, transactions integrity, normalization rules, and performance optimizations.',
  'Backend',
  'Intermediate',
  40,
  '["PostgreSQL","SQL","Databases","Relational"]'::jsonb,
  'public',
  true,
  true,
  false,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'b0000000-0000-0000-0000-000000000003';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'b0000000-0000-0000-0000-000000000003';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('7d9ef50e-5ac2-48ca-a78e-114d226afd12', 'b0000000-0000-0000-0000-000000000003', 'topic', 'Table Schema & Joins', 'CREATE TABLE, foreign keys, INNER/LEFT/OUTER joins query patterns.', 12, 'PHASE 1', 250, 100),
  ('9b2ad00b-684f-046f-8ad5-5d753a5c20b0', 'b0000000-0000-0000-0000-000000000003', 'topic', 'ACID & Transactions', 'COMMIT, ROLLBACK, isolation levels, concurrency problems (dirty reads).', 10, 'PHASE 2', 450, 200),
  ('b785da09-6de7-e61e-d91b-bd1bcf9861a3', 'b0000000-0000-0000-0000-000000000003', 'milestone', 'Indexes & Query Tuning', 'B-Tree indexes, EXPLAIN ANALYZE, vacuuming, view indexes.', 8, 'PHASE 3', 350, 350);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('b0000000-0000-0000-0000-000000000003', '7d9ef50e-5ac2-48ca-a78e-114d226afd12', '9b2ad00b-684f-046f-8ad5-5d753a5c20b0', true),
  ('b0000000-0000-0000-0000-000000000003', '9b2ad00b-684f-046f-8ad5-5d753a5c20b0', 'b785da09-6de7-e61e-d91b-bd1bcf9861a3', true);

-- Seeding template: Python
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Python',
  'Learn Python programming language constructs, object-oriented concepts, virtual environments, and data package collections.',
  'AI / ML',
  'Beginner',
  30,
  '["Python","AI Core","Language"]'::jsonb,
  'public',
  true,
  false,
  false,
  true,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'a0000000-0000-0000-0000-000000000001';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'a0000000-0000-0000-0000-000000000001';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('397a5dae-637c-994c-2ccb-43c25895fcdd', 'a0000000-0000-0000-0000-000000000001', 'topic', 'Syntax & Functions', 'Lists, dicts, conditionals, loops, lambda functions, type hints.', 10, 'WEEK 1', 200, 100),
  ('6d617c92-1ac6-503c-5c08-639d4fe3d4f0', 'a0000000-0000-0000-0000-000000000001', 'topic', 'OOP & File I/O', 'Classes, inheritance, reading/writing files, handling exceptions.', 8, 'WEEK 2', 400, 200),
  ('c06ff9cc-e7d3-80c0-ab12-ec94004c1223', 'a0000000-0000-0000-0000-000000000001', 'milestone', 'Pip & Poetry Virtualenvs', 'Virtual environments setup, pip installs, project structures.', 6, 'WEEK 3', 300, 320);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '397a5dae-637c-994c-2ccb-43c25895fcdd', '6d617c92-1ac6-503c-5c08-639d4fe3d4f0', true),
  ('a0000000-0000-0000-0000-000000000001', '6d617c92-1ac6-503c-5c08-639d4fe3d4f0', 'c06ff9cc-e7d3-80c0-ab12-ec94004c1223', true);

-- Seeding template: Machine Learning
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Machine Learning',
  'Master math prerequisites, features preprocessing, regression and classification modeling, and evaluation parameters.',
  'AI / ML',
  'Intermediate',
  90,
  '["Machine Learning","Data Science","Scikit-Learn"]'::jsonb,
  'public',
  true,
  true,
  false,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'a0000000-0000-0000-0000-000000000002';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'a0000000-0000-0000-0000-000000000002';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('a895629e-3376-6d3c-a828-abc7b890c07b', 'a0000000-0000-0000-0000-000000000002', 'topic', 'Preprocessing & Math', 'Linear algebra, calculus vectors, scaling, encoding values, imputation.', 15, 'PHASE 1', 200, 100),
  ('fbf835a0-e231-61cc-32a5-6ba0570ec3a0', 'a0000000-0000-0000-0000-000000000002', 'topic', 'Supervised Models', 'Regression models, decision trees, random forests, boosting networks.', 18, 'PHASE 2', 400, 200),
  ('a9e0a6ad-7e93-2e28-d2fb-a38abecae419', 'a0000000-0000-0000-0000-000000000002', 'topic', 'Unsupervised Models', 'K-Means clustering, PCA dimension reduction, hierarchical clustering.', 10, 'PHASE 3', 200, 350),
  ('2663cc42-7b1c-0d1d-31d6-7bd1ac7ea588', 'a0000000-0000-0000-0000-000000000002', 'milestone', 'Evaluation Metrics', 'Precision, Recall, ROC AUC curves, Cross-Validation scoring.', 8, 'PHASE 4', 300, 480);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('a0000000-0000-0000-0000-000000000002', 'a895629e-3376-6d3c-a828-abc7b890c07b', 'fbf835a0-e231-61cc-32a5-6ba0570ec3a0', true),
  ('a0000000-0000-0000-0000-000000000002', 'fbf835a0-e231-61cc-32a5-6ba0570ec3a0', 'a9e0a6ad-7e93-2e28-d2fb-a38abecae419', false),
  ('a0000000-0000-0000-0000-000000000002', 'a9e0a6ad-7e93-2e28-d2fb-a38abecae419', '2663cc42-7b1c-0d1d-31d6-7bd1ac7ea588', true);

-- Seeding template: Generative AI
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'Generative AI',
  'Learn LLM pipelines, prompt design rules, semantic embeddings, vector databases, and orchestrating RAG workflows.',
  'AI / ML',
  'Advanced',
  80,
  '["GenAI","LLMs","VectorDB","RAG"]'::jsonb,
  'public',
  true,
  true,
  true,
  false,
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'a0000000-0000-0000-0000-000000000003';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'a0000000-0000-0000-0000-000000000003';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('f1c99f8a-3b96-fe02-9a0d-5645b3ecafcd', 'a0000000-0000-0000-0000-000000000003', 'topic', 'Prompting & LLM APIs', 'System prompts, zero-shot/few-shot, token constraints, temperature parameters.', 8, 'WEEK 1', 250, 100),
  ('418eb807-124b-1dc4-f470-12556eaf9f67', 'a0000000-0000-0000-0000-000000000003', 'topic', 'Vector Embeddings', 'Distance calculations (cosine, dot), tokenization layers, generating embeddings.', 10, 'WEEK 2', 450, 200),
  ('a8f9db05-2b1b-81f4-9840-be1ad9ffad11', 'a0000000-0000-0000-0000-000000000003', 'topic', 'Vector Databases', 'Pinecone, ChromaDB, PGVector indexing, metadata queries.', 8, 'WEEK 3', 250, 350),
  ('ebabbeda-df77-c849-a1ec-0dd5d971797f', 'a0000000-0000-0000-0000-000000000003', 'milestone', 'Retrieval Augmented Gen', 'LangChain indexing, document loaders, chunking strategies, generation steps.', 12, 'WEEK 4', 350, 480);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('a0000000-0000-0000-0000-000000000003', 'f1c99f8a-3b96-fe02-9a0d-5645b3ecafcd', '418eb807-124b-1dc4-f470-12556eaf9f67', true),
  ('a0000000-0000-0000-0000-000000000003', '418eb807-124b-1dc4-f470-12556eaf9f67', 'a8f9db05-2b1b-81f4-9840-be1ad9ffad11', false),
  ('a0000000-0000-0000-0000-000000000003', 'a8f9db05-2b1b-81f4-9840-be1ad9ffad11', 'ebabbeda-df77-c849-a1ec-0dd5d971797f', true);

-- Seeding template: Aptitude
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'p0000000-0000-0000-0000-000000000001',
  'Aptitude',
  'Master quantitative math tricks, logical connections, coding puzzles, and verbal reasoning skills for screening exams.',
  'Placement',
  'Beginner',
  50,
  '["Aptitude","Math Tricks","Placement Exams"]'::jsonb,
  'public',
  true,
  false,
  false,
  true,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'p0000000-0000-0000-0000-000000000001';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'p0000000-0000-0000-0000-000000000001';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('39998939-0f9f-c65e-563c-4fcaa2007a7d', 'p0000000-0000-0000-0000-000000000001', 'topic', 'Quantitative Skills', 'Averages, speed, work, simple/compound interest, statistics math.', 15, 'STEP 1', 200, 100),
  ('8c76687c-2830-dd5c-4e26-4ede9f7e435f', 'p0000000-0000-0000-0000-000000000001', 'topic', 'Logical Reasoning', 'Coding-decoding, blood relations, syllogisms, grid mapping.', 12, 'STEP 2', 400, 200),
  ('f09dc03e-0295-4c46-d084-3eb3d9ff92e9', 'p0000000-0000-0000-0000-000000000001', 'milestone', 'Verbal & Data Interp', 'Comprehension analysis, paragraph ordering, charts and maps.', 8, 'STEP 3', 300, 320);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('p0000000-0000-0000-0000-000000000001', '39998939-0f9f-c65e-563c-4fcaa2007a7d', '8c76687c-2830-dd5c-4e26-4ede9f7e435f', true),
  ('p0000000-0000-0000-0000-000000000001', '8c76687c-2830-dd5c-4e26-4ede9f7e435f', 'f09dc03e-0295-4c46-d084-3eb3d9ff92e9', true);

-- Seeding template: Operating Systems
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'p0000000-0000-0000-0000-000000000002',
  'Operating Systems',
  'Core concepts of process control blocks, CPU scheduler algorithms, virtual memory, paging, thrashing, and disk algorithms.',
  'Placement',
  'Intermediate',
  30,
  '["OS","CS Core","Placement"]'::jsonb,
  'public',
  true,
  false,
  false,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'p0000000-0000-0000-0000-000000000002';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'p0000000-0000-0000-0000-000000000002';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('d2e6ab75-37da-cd2e-9499-3513b4529e8b', 'p0000000-0000-0000-0000-000000000002', 'topic', 'Process & CPU Scheduling', 'FCFS, SJF, SRTF, Priority, Round Robin scheduler logic.', 10, 'PHASE 1', 200, 100),
  ('d8517a76-f3d4-8fb4-f370-708da0a0b872', 'p0000000-0000-0000-0000-000000000002', 'topic', 'Synchronization & Deadlocks', 'Semaphores, mutexes, Banker''s algorithm, deadlock detection rules.', 8, 'PHASE 2', 400, 200),
  ('ee045df8-df93-a84d-2c2c-115f49c464f6', 'p0000000-0000-0000-0000-000000000002', 'milestone', 'Memory & Disk Scheduler', 'Paging, TLB, page replacement (LRU, FIFO), SSTF, SCAN disk rules.', 10, 'PHASE 3', 300, 320);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('p0000000-0000-0000-0000-000000000002', 'd2e6ab75-37da-cd2e-9499-3513b4529e8b', 'd8517a76-f3d4-8fb4-f370-708da0a0b872', true),
  ('p0000000-0000-0000-0000-000000000002', 'd8517a76-f3d4-8fb4-f370-708da0a0b872', 'ee045df8-df93-a84d-2c2c-115f49c464f6', true);

-- Seeding template: DBMS
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'p0000000-0000-0000-0000-000000000003',
  'DBMS',
  'Learn SQL schema rules, normal forms (1NF-BCNF), ACID transaction locks, and relational DB algebra.',
  'Placement',
  'Intermediate',
  35,
  '["DBMS","SQL","CS Core"]'::jsonb,
  'public',
  true,
  false,
  false,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'p0000000-0000-0000-0000-000000000003';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'p0000000-0000-0000-0000-000000000003';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('403cacaf-f9c7-a825-d0b1-5e96cd7ff047', 'p0000000-0000-0000-0000-000000000003', 'topic', 'ER Model & SQL Queries', 'ER mapping, keys (candidate, primary), aggregation SQL patterns.', 10, 'STEP 1', 200, 100),
  ('a227acdf-9ba2-6970-83a9-746b9967dea8', 'p0000000-0000-0000-0000-000000000003', 'topic', 'Normalization Normal Forms', '1NF, 2NF, 3NF, BCNF algorithms, dependency preservation rules.', 8, 'STEP 2', 400, 200),
  ('30ac97cd-9491-f136-4107-9a53c894cdcc', 'p0000000-0000-0000-0000-000000000003', 'milestone', 'ACID & Index Files', 'Serializability, 2PL locks, dense/sparse indexing, B+ tree properties.', 10, 'STEP 3', 300, 320);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('p0000000-0000-0000-0000-000000000003', '403cacaf-f9c7-a825-d0b1-5e96cd7ff047', 'a227acdf-9ba2-6970-83a9-746b9967dea8', true),
  ('p0000000-0000-0000-0000-000000000003', 'a227acdf-9ba2-6970-83a9-746b9967dea8', '30ac97cd-9491-f136-4107-9a53c894cdcc', true);

-- Seeding template: Computer Networks
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'p0000000-0000-0000-0000-000000000004',
  'Computer Networks',
  'Learn network reference models, TCP handshake sequences, routing math, IP subnetting, and application layer protocols.',
  'Placement',
  'Intermediate',
  30,
  '["CN","Networks","CS Core"]'::jsonb,
  'public',
  true,
  false,
  false,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'p0000000-0000-0000-0000-000000000004';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'p0000000-0000-0000-0000-000000000004';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('4e55840c-3daf-6fc5-800d-8e0c12b63722', 'p0000000-0000-0000-0000-000000000004', 'topic', 'OSI Reference Model', 'Physical, Data Link, Network, Transport layers services.', 8, 'WEEK 1', 200, 100),
  ('9c31b0aa-e6c7-dcd3-f683-f7044182af35', 'p0000000-0000-0000-0000-000000000004', 'topic', 'IP Subnetting & Routing', 'Classless routing CIDR, subnet masks, Dijkstra routing, Link State protocol.', 10, 'WEEK 2', 400, 200),
  ('90c5fa6a-cdef-d6f8-51a8-4864ba2f533f', 'p0000000-0000-0000-0000-000000000004', 'milestone', 'TCP & App Layer Protocols', '3-way handshake, window size flow control, DNS, HTTP, TLS parameters.', 8, 'WEEK 3', 300, 320);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('p0000000-0000-0000-0000-000000000004', '4e55840c-3daf-6fc5-800d-8e0c12b63722', '9c31b0aa-e6c7-dcd3-f683-f7044182af35', true),
  ('p0000000-0000-0000-0000-000000000004', '9c31b0aa-e6c7-dcd3-f683-f7044182af35', '90c5fa6a-cdef-d6f8-51a8-4864ba2f533f', true);

-- Seeding template: Object-Oriented Programming
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  'p0000000-0000-0000-0000-000000000005',
  'Object-Oriented Programming',
  'Study the pillars of OOPs (Encapsulation, Inheritance, Polymorphism, Abstraction), constructors, virtual tables, and interfaces.',
  'Placement',
  'Intermediate',
  25,
  '["OOPs","CS Core","Interview Prep"]'::jsonb,
  'public',
  true,
  true,
  false,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = 'p0000000-0000-0000-0000-000000000005';
DELETE FROM public.roadmap_template_edges WHERE template_id = 'p0000000-0000-0000-0000-000000000005';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('10a7ebc1-b1eb-54da-539b-9606481e5a3d', 'p0000000-0000-0000-0000-000000000005', 'topic', 'Classes & Encapsulation', 'Access modifiers, constructor overloading, this reference structures.', 8, 'STEP 1', 200, 100),
  ('ae89c3e8-9017-6980-0868-593e9c991338', 'p0000000-0000-0000-0000-000000000005', 'topic', 'Inheritance & Polymorphism', 'Dynamic dispatching, virtual tables, override vs overload concepts.', 8, 'STEP 2', 400, 200),
  ('cbf46843-04ee-7e96-a8c7-336f2ec126a9', 'p0000000-0000-0000-0000-000000000005', 'milestone', 'Abstraction & Interfaces', 'Pure virtual functions, multiple inheritance problems, interfaces layout.', 6, 'STEP 3', 300, 320);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('p0000000-0000-0000-0000-000000000005', '10a7ebc1-b1eb-54da-539b-9606481e5a3d', 'ae89c3e8-9017-6980-0868-593e9c991338', true),
  ('p0000000-0000-0000-0000-000000000005', 'ae89c3e8-9017-6980-0868-593e9c991338', 'cbf46843-04ee-7e96-a8c7-336f2ec126a9', true);

-- Seeding template: CSE Placement Preparation
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'CSE Placement Preparation',
  'Master the complete campus placement curriculum: aptitude, operating systems, databases, Object Oriented Programming, and basic coding constructs.',
  'Placement',
  'Intermediate',
  120,
  '["Aptitude","DBMS","OS","OOPs","Placement"]'::jsonb,
  'public',
  true,
  true,
  true,
  false,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = '11111111-1111-1111-1111-111111111111';
DELETE FROM public.roadmap_template_edges WHERE template_id = '11111111-1111-1111-1111-111111111111';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('a0f9d387-f0a8-a0e5-a7e6-81a057c42760', '11111111-1111-1111-1111-111111111111', 'topic', 'Quantitative Aptitude', 'Solve logical reasoning, speed-time, and probability problems.', 15, 'WEEK 1', 100, 100),
  ('040487f6-b7c9-928f-0b29-a01b3b465155', '11111111-1111-1111-1111-111111111111', 'topic', 'Operating Systems', 'Process synchronization, scheduling algorithms, and memory management concepts.', 20, 'WEEK 2', 300, 200),
  ('8e942051-bbb1-b725-e5df-25a28e3809e4', '11111111-1111-1111-1111-111111111111', 'topic', 'Database Systems', 'SQL normalization, indexing, Joins, and transaction protocols.', 20, 'WEEK 3', 100, 350),
  ('6536c74e-c90c-c0e9-9263-68e26b943458', '11111111-1111-1111-1111-111111111111', 'topic', 'Object-Oriented Programming', 'Polymorphism, Inheritance, Encapsulation, and Design patterns in C++/Java.', 15, 'WEEK 4', 300, 450),
  ('7c076b03-867e-a9e5-de92-462d133ca094', '11111111-1111-1111-1111-111111111111', 'milestone', 'Placement Readiness Mock', 'Complete full-length simulated technical interview tests.', 0, 'FINALE', 200, 600);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'a0f9d387-f0a8-a0e5-a7e6-81a057c42760', '040487f6-b7c9-928f-0b29-a01b3b465155', true),
  ('11111111-1111-1111-1111-111111111111', '040487f6-b7c9-928f-0b29-a01b3b465155', '8e942051-bbb1-b725-e5df-25a28e3809e4', false),
  ('11111111-1111-1111-1111-111111111111', '8e942051-bbb1-b725-e5df-25a28e3809e4', '6536c74e-c90c-c0e9-9263-68e26b943458', false),
  ('11111111-1111-1111-1111-111111111111', '6536c74e-c90c-c0e9-9263-68e26b943458', '7c076b03-867e-a9e5-de92-462d133ca094', true);

-- Seeding template: 90-Day DSA Challenge
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '90-Day DSA Challenge',
  'Intensive curriculum covering core data structures, algorithms, sorting techniques, dynamic programming, and graphs for top-tier product roles.',
  'DSA',
  'Advanced',
  180,
  '["DSA","NeetCode","Interview Prep","Algorithms"]'::jsonb,
  'public',
  true,
  true,
  false,
  false,
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = '22222222-2222-2222-2222-222222222222';
DELETE FROM public.roadmap_template_edges WHERE template_id = '22222222-2222-2222-2222-222222222222';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('9e303326-88fc-e399-d707-3bc486932e5a', '22222222-2222-2222-2222-222222222222', 'topic', 'Arrays & Hashing', 'Learn Hash Maps, Prefix Sums, and Sliding Window techniques.', 15, 'PHASE 1', 100, 100),
  ('48c36527-63f1-15cd-3413-f965a56f82c5', '22222222-2222-2222-2222-222222222222', 'topic', 'Trees & Graphs', 'Master Depth First Search, Breadth First Search, and Binary Trees.', 25, 'PHASE 2', 300, 200),
  ('ac5080d9-ecf2-df27-87b8-2916b7da1697', '22222222-2222-2222-2222-222222222222', 'topic', 'Dynamic Programming', 'Knapsack patterns, grid paths, and optimization memoization algorithms.', 20, 'PHASE 3', 200, 380);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('22222222-2222-2222-2222-222222222222', '9e303326-88fc-e399-d707-3bc486932e5a', '48c36527-63f1-15cd-3413-f965a56f82c5', true),
  ('22222222-2222-2222-2222-222222222222', '48c36527-63f1-15cd-3413-f965a56f82c5', 'ac5080d9-ecf2-df27-87b8-2916b7da1697', true);

-- Seeding template: Full Stack Developer
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Full Stack Developer',
  'A comprehensive path covering HTML/CSS structure, frontend React frameworks, backend Express.js server layers, databases, and deployment pipelines.',
  'Development',
  'Beginner',
  200,
  '["Web Dev","Fullstack","React","Node","Postgres"]'::jsonb,
  'public',
  true,
  false,
  true,
  true,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = '33333333-3333-3333-3333-333333333333';
DELETE FROM public.roadmap_template_edges WHERE template_id = '33333333-3333-3333-3333-333333333333';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('bed78757-7bc4-7a1f-caa0-963db5d48604', '33333333-3333-3333-3333-333333333333', 'topic', 'Frontend Fundamentals', 'HTML structural layout, vanilla CSS styling, Responsive design paradigms.', 10, 'HTML & CSS', 100, 100),
  ('4faf8ab1-e921-b49d-796a-b0d443eef3a0', '33333333-3333-3333-3333-333333333333', 'topic', 'React & State Management', 'Functional hooks, components state lifecycle, Tailwind CSS integrations.', 15, 'VITE + REACT', 300, 200),
  ('2287d3e8-f6c3-d6c6-9bef-6d841085b7f9', '33333333-3333-3333-3333-333333333333', 'topic', 'Backend Express & Node', 'REST API design patterns, middle-ware stacks, and file handlers.', 15, 'BACKEND', 100, 350),
  ('44778317-a47b-8492-5670-370fa03b4a28', '33333333-3333-3333-3333-333333333333', 'milestone', 'Database & CI/CD Deployment', 'Configure Postgres / Mongo databases and deploy projects to Vercel/Docker.', 0, 'DEPLOY', 300, 450);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'bed78757-7bc4-7a1f-caa0-963db5d48604', '4faf8ab1-e921-b49d-796a-b0d443eef3a0', true),
  ('33333333-3333-3333-3333-333333333333', '4faf8ab1-e921-b49d-796a-b0d443eef3a0', '2287d3e8-f6c3-d6c6-9bef-6d841085b7f9', false),
  ('33333333-3333-3333-3333-333333333333', '2287d3e8-f6c3-d6c6-9bef-6d841085b7f9', '44778317-a47b-8492-5670-370fa03b4a28', true);

-- Seeding template: AI Engineer
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'AI Engineer',
  'Master Deep Learning foundations, Natural Language Processing, Transformer architectures, RAG implementations, and LLM orchestration tools like LangChain.',
  'AI / ML',
  'Advanced',
  250,
  '["AI","LLMs","LangChain","Deep Learning"]'::jsonb,
  'public',
  true,
  true,
  true,
  false,
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = '44444444-4444-4444-4444-444444444444';
DELETE FROM public.roadmap_template_edges WHERE template_id = '44444444-4444-4444-4444-444444444444';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('b24df38a-7a1e-8003-c3a5-5df304595400', '44444444-4444-4444-4444-444444444444', 'topic', 'Neural Networks Fundamentals', 'Learn PyTorch, backpropagation, and multi-layer perceptron models.', 12, 'DEEP LEARNING', 100, 100),
  ('5e87f56b-b8ad-2035-59b5-cb2d668a9f5d', '44444444-4444-4444-4444-444444444444', 'topic', 'Transformers & NLP', 'Understand self-attention architectures and BERT/GPT pipeline layers.', 15, 'TRANSFORMERS', 300, 200),
  ('0c9395dc-34aa-9dd5-7f09-4a196c335f91', '44444444-4444-4444-4444-444444444444', 'topic', 'LLM Engineering & RAG', 'Develop production Retrieval-Augmented Generation workflows using vector stores.', 20, 'RAG WORKFLOWS', 200, 360);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'b24df38a-7a1e-8003-c3a5-5df304595400', '5e87f56b-b8ad-2035-59b5-cb2d668a9f5d', true),
  ('44444444-4444-4444-4444-444444444444', '5e87f56b-b8ad-2035-59b5-cb2d668a9f5d', '0c9395dc-34aa-9dd5-7f09-4a196c335f91', true);

-- Seeding template: Data Scientist
INSERT INTO public.roadmap_templates (id, title, description, category, difficulty, estimated_hours, tags, visibility, is_public, is_featured, is_trending, is_beginner_friendly, is_advanced)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'Data Scientist',
  'Gain fluency in math, visual storytelling, exploratory analysis, regression/classification, and scalable big data querying.',
  'AI / ML',
  'Intermediate',
  160,
  '["Data Science","Pandas","Analytics","Statistics"]'::jsonb,
  'public',
  true,
  false,
  false,
  true,
  false
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  estimated_hours = EXCLUDED.estimated_hours,
  tags = EXCLUDED.tags,
  is_featured = EXCLUDED.is_featured,
  is_trending = EXCLUDED.is_trending,
  is_beginner_friendly = EXCLUDED.is_beginner_friendly,
  is_advanced = EXCLUDED.is_advanced;

-- Clear previous nodes/edges for this template to prevent duplicates on override
DELETE FROM public.roadmap_template_nodes WHERE template_id = '55555555-5555-5555-5555-555555555555';
DELETE FROM public.roadmap_template_edges WHERE template_id = '55555555-5555-5555-5555-555555555555';

INSERT INTO public.roadmap_template_nodes (id, template_id, node_type, title, description, total, label, position_x, position_y)
VALUES
  ('220d8060-54cf-331b-cf6d-20daee22b317', '55555555-5555-5555-5555-555555555555', 'topic', 'Math & Statistics', 'Probability theory, hypothesis testing, linear algebra concepts.', 10, 'MATH', 100, 100),
  ('ba027fb8-5640-6bd2-cf15-e67eca07d730', '55555555-5555-5555-5555-555555555555', 'topic', 'Data Exploration & Pandas', 'Data wrangling, cleaning operations, and Matplotlib visualizations.', 15, 'ANALYSIS', 300, 200),
  ('e2902652-49a8-043b-ee22-cc8d9e8ffdce', '55555555-5555-5555-5555-555555555555', 'topic', 'Supervised Learning', 'Implement regression, decision trees, and random forests models.', 20, 'ML MODELS', 200, 360);

INSERT INTO public.roadmap_template_edges (template_id, source_node_id, target_node_id, animated)
VALUES
  ('55555555-5555-5555-5555-555555555555', '220d8060-54cf-331b-cf6d-20daee22b317', 'ba027fb8-5640-6bd2-cf15-e67eca07d730', true),
  ('55555555-5555-5555-5555-555555555555', 'ba027fb8-5640-6bd2-cf15-e67eca07d730', 'e2902652-49a8-043b-ee22-cc8d9e8ffdce', true);
