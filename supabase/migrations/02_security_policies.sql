-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Articles policies
CREATE POLICY "Users can view their own articles" 
  ON articles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own articles" 
  ON articles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles" 
  ON articles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles" 
  ON articles FOR DELETE 
  USING (auth.uid() = user_id);

-- Highlights policies
CREATE POLICY "Users can view their own highlights" 
  ON highlights FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own highlights" 
  ON highlights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlights" 
  ON highlights FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlights" 
  ON highlights FOR DELETE 
  USING (auth.uid() = user_id);

-- Notes policies
CREATE POLICY "Users can view their own notes" 
  ON notes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
  ON notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
  ON notes FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
  ON notes FOR DELETE 
  USING (auth.uid() = user_id);

-- Tags policies
CREATE POLICY "Users can view their own tags" 
  ON tags FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tags" 
  ON tags FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" 
  ON tags FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" 
  ON tags FOR DELETE 
  USING (auth.uid() = user_id);

-- Article_Tags policies
CREATE POLICY "Users can view their own article tags" 
  ON article_tags FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_id 
      AND articles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own article tags" 
  ON article_tags FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_id 
      AND articles.user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM tags 
      WHERE tags.id = tag_id 
      AND tags.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own article tags" 
  ON article_tags FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_id 
      AND articles.user_id = auth.uid()
    )
  );

-- AI_Conversations policies
CREATE POLICY "Users can view their own AI conversations" 
  ON ai_conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI conversations" 
  ON ai_conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI conversations" 
  ON ai_conversations FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI conversations" 
  ON ai_conversations FOR DELETE 
  USING (auth.uid() = user_id);

-- AI_Messages policies
CREATE POLICY "Users can view their own AI messages" 
  ON ai_messages FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own AI messages" 
  ON ai_messages FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations 
      WHERE ai_conversations.id = conversation_id 
      AND ai_conversations.user_id = auth.uid()
    )
  ); 