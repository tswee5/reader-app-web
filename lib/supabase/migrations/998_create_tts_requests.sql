-- Create table for tracking text-to-speech requests
CREATE TABLE IF NOT EXISTS tts_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  text_length INTEGER NOT NULL,
  voice VARCHAR(255) NOT NULL, -- ElevenLabs voice ID
  model VARCHAR(255), -- ElevenLabs model ID
  stability FLOAT, -- Voice stability parameter (0-1)
  similarity_boost FLOAT, -- Voice similarity boost parameter (0-1)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE tts_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for select operations
CREATE POLICY "Users can view their own tts requests" 
  ON tts_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);
  
-- Create policy for insert operations
CREATE POLICY "Users can create tts requests" 
  ON tts_requests 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX tts_requests_user_id_idx ON tts_requests(user_id);
CREATE INDEX tts_requests_article_id_idx ON tts_requests(article_id);
CREATE INDEX tts_requests_created_at_idx ON tts_requests(created_at);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON tts_requests TO authenticated; 