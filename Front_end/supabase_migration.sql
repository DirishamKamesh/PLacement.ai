-- ============================================================
-- PlaceMentor AI — Database Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- ── 1. Users Profile Table ───────────────────────────────────
-- Extends Supabase Auth's auth.users with application-specific fields.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  institution TEXT,
  department TEXT,
  bio TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 2. Roadmaps Table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  total_challenges INTEGER DEFAULT 0,
  completed_challenges INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmaps_user_id ON public.roadmaps(user_id);

-- ── 3. Roadmap Nodes Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmap_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  node_type TEXT NOT NULL DEFAULT 'topic' CHECK (node_type IN ('topic', 'challenge', 'project', 'milestone')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'in-progress', 'completed')),
  solved INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  label TEXT DEFAULT '',
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_roadmap_id ON public.roadmap_nodes(roadmap_id);

-- ── 4. Roadmap Edges Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmap_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  animated BOOLEAN DEFAULT false,
  style JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_edges_roadmap_id ON public.roadmap_edges(roadmap_id);

-- ── 5. Attendance Records Table ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  check_in_time TIME,
  location TEXT DEFAULT '',
  mode TEXT DEFAULT 'manual' CHECK (mode IN ('biometric', 'qr', 'manual')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance_records(user_id, attendance_date);
-- Prevent duplicate check-ins on the same day
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique_day ON public.attendance_records(user_id, attendance_date);

-- ── 6. Resumes Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  mime_type TEXT DEFAULT 'application/pdf',
  ats_score INTEGER,
  health_score INTEGER,
  found_keywords JSONB DEFAULT '[]'::jsonb,
  missing_keywords JSONB DEFAULT '[]'::jsonb,
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  target_role TEXT DEFAULT 'Software Engineer',
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

-- ── 7. Chat Conversations Table ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  context TEXT NOT NULL DEFAULT 'global' CHECK (context IN ('global', 'workspace', 'interview')),
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_user_id ON public.chat_conversations(user_id);


-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

-- Users: read/update own row only
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Roadmaps: full CRUD on own roadmaps
CREATE POLICY "Users can view own roadmaps" ON public.roadmaps
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create roadmaps" ON public.roadmaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmaps" ON public.roadmaps
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own roadmaps" ON public.roadmaps
  FOR DELETE USING (auth.uid() = user_id);

-- Roadmap Nodes: access through roadmap ownership
CREATE POLICY "Users can view own roadmap nodes" ON public.roadmap_nodes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert roadmap nodes" ON public.roadmap_nodes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update own roadmap nodes" ON public.roadmap_nodes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete own roadmap nodes" ON public.roadmap_nodes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

-- Roadmap Edges: access through roadmap ownership
CREATE POLICY "Users can view own roadmap edges" ON public.roadmap_edges
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert roadmap edges" ON public.roadmap_edges
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can update own roadmap edges" ON public.roadmap_edges
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete own roadmap edges" ON public.roadmap_edges
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

-- Attendance: read own records, insert own check-ins
CREATE POLICY "Users can view own attendance" ON public.attendance_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can check in" ON public.attendance_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Resumes: full CRUD on own resumes
CREATE POLICY "Users can view own resumes" ON public.resumes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can upload resumes" ON public.resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resumes" ON public.resumes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resumes" ON public.resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Chat Conversations: full CRUD on own conversations
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.chat_conversations
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- Storage Bucket for Resumes
-- Run this AFTER creating the bucket in Supabase Dashboard:
-- Storage > New Bucket > "resumes" (public: false)
-- ============================================================

-- Storage policies (uncomment after creating the bucket):
-- CREATE POLICY "Users can upload own resumes" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view own resumes" ON storage.objects
--   FOR SELECT USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own resumes" ON storage.objects
--   FOR DELETE USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);
