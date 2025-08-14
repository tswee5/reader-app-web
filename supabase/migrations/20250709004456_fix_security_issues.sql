-- Fix Security Issues Migration
-- Addresses all 7 security concerns flagged by Supabase

-- 1. Fix Security Definer View Issue
-- Drop and recreate the ai_conversation_analytics view with SECURITY INVOKER
DROP VIEW IF EXISTS public.ai_conversation_analytics;

CREATE VIEW public.ai_conversation_analytics AS
SELECT 
  ac.id as conversation_id,
  ac.title,
  ac.created_at,
  ac.updated_at,
  a.title as article_title,
  a.url as article_url,
  COUNT(am.id) as message_count,
  MAX(am.created_at) as last_message_at
FROM public.ai_conversations ac
LEFT JOIN public.articles a ON ac.article_id = a.id
LEFT JOIN public.ai_messages am ON ac.id = am.conversation_id
GROUP BY ac.id, ac.title, ac.created_at, ac.updated_at, a.title, a.url;

-- 2. Enable RLS on missing tables
-- These tables exist in the database but don't have RLS enabled
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_articles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS policies for collections table
CREATE POLICY "Users can view their own collections" 
  ON public.collections FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public collections" 
  ON public.collections FOR SELECT 
  USING (is_public = TRUE);

CREATE POLICY "Users can create their own collections" 
  ON public.collections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections" 
  ON public.collections FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections" 
  ON public.collections FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. Create RLS policies for collection_articles table
CREATE POLICY "Users can view their own collection articles" 
  ON public.collection_articles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collection articles" 
  ON public.collection_articles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collection articles" 
  ON public.collection_articles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collection articles" 
  ON public.collection_articles FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Ensure existing policies are properly applied
-- Drop and recreate policies for tables that might have conflicting policies
DROP POLICY IF EXISTS "Users can view their own highlights" ON public.highlights;
DROP POLICY IF EXISTS "Users can create their own highlights" ON public.highlights;
DROP POLICY IF EXISTS "Users can update their own highlights" ON public.highlights;
DROP POLICY IF EXISTS "Users can delete their own highlights" ON public.highlights;

CREATE POLICY "Users can view their own highlights" 
  ON public.highlights FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights" 
  ON public.highlights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights" 
  ON public.highlights FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights" 
  ON public.highlights FOR DELETE 
  USING (auth.uid() = user_id);

-- Notes policies
DROP POLICY IF EXISTS "Users can view their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can create their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

CREATE POLICY "Users can view their own notes" 
  ON public.notes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
  ON public.notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
  ON public.notes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
  ON public.notes FOR DELETE 
  USING (auth.uid() = user_id);

-- Tags policies
DROP POLICY IF EXISTS "Users can view their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can create their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can update their own tags" ON public.tags;
DROP POLICY IF EXISTS "Users can delete their own tags" ON public.tags;

CREATE POLICY "Users can view their own tags" 
  ON public.tags FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
  ON public.tags FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
  ON public.tags FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
  ON public.tags FOR DELETE 
  USING (auth.uid() = user_id);

-- Article tags policies
DROP POLICY IF EXISTS "Users can view their own article tags" ON public.article_tags;
DROP POLICY IF EXISTS "Users can create their own article tags" ON public.article_tags;
DROP POLICY IF EXISTS "Users can delete their own article tags" ON public.article_tags;

CREATE POLICY "Users can view their own article tags" 
  ON public.article_tags FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own article tags" 
  ON public.article_tags FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own article tags" 
  ON public.article_tags FOR DELETE 
  USING (auth.uid() = user_id);
