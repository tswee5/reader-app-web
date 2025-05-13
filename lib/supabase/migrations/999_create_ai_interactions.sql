-- Create AI interactions table to store user's article questions and AI responses
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_query TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Enable RLS
  CONSTRAINT ai_interactions_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Set up Row Level Security
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Create policy for select operations
CREATE POLICY "Users can view their own ai interactions" 
  ON ai_interactions 
  FOR SELECT 
  USING (auth.uid() = user_id);
  
-- Create policy for insert operations
CREATE POLICY "Users can insert their own ai interactions" 
  ON ai_interactions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy for update operations (generally not needed for interactions)
CREATE POLICY "Users can update their own ai interactions" 
  ON ai_interactions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy for delete operations
CREATE POLICY "Users can delete their own ai interactions" 
  ON ai_interactions 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX ai_interactions_user_id_idx ON ai_interactions(user_id);
CREATE INDEX ai_interactions_article_id_idx ON ai_interactions(article_id);
CREATE INDEX ai_interactions_created_at_idx ON ai_interactions(created_at);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_interactions TO authenticated; 