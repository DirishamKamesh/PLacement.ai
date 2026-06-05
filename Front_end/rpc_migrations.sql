-- Run this script in the Supabase SQL Editor to support the backend migration

-- 1. Function to safely toggle a like and update the counter
CREATE OR REPLACE FUNCTION public.toggle_template_like(p_template_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_exists BOOLEAN;
  v_likes_count INTEGER;
  v_liked BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if already liked
  SELECT EXISTS(
    SELECT 1 FROM roadmap_likes 
    WHERE template_id = p_template_id AND user_id = v_user_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Unlike
    DELETE FROM roadmap_likes WHERE template_id = p_template_id AND user_id = v_user_id;
    UPDATE roadmap_templates SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = p_template_id 
    RETURNING likes_count INTO v_likes_count;
    v_liked := FALSE;
  ELSE
    -- Like
    INSERT INTO roadmap_likes (template_id, user_id) VALUES (p_template_id, v_user_id);
    UPDATE roadmap_templates SET likes_count = likes_count + 1 
    WHERE id = p_template_id 
    RETURNING likes_count INTO v_likes_count;
    v_liked := TRUE;
  END IF;

  RETURN json_build_object('liked', v_liked, 'likes_count', v_likes_count);
END;
$$;

-- 2. Function to safely increment template clones count
CREATE OR REPLACE FUNCTION public.increment_template_clone_count(p_template_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- We allow any authenticated user to increment the clone count when they clone a roadmap
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE roadmap_templates 
  SET clones_count = clones_count + 1 
  WHERE id = p_template_id;
END;
$$;
