-- Enhance AI conversations table with stateful features
-- Add new columns to ai_conversations table
ALTER TABLE ai_conversations 
ADD COLUMN IF NOT EXISTS article_summary TEXT,
ADD COLUMN IF NOT EXISTS web_snippets JSONB,
ADD COLUMN IF NOT EXISTS memory_summary TEXT,
ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_web_search_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conversation_length INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN ai_conversations.article_summary IS 'Stores the article summary generated on first message';
COMMENT ON COLUMN ai_conversations.web_snippets IS 'Stores top 3-5 web search snippets as JSON array';
COMMENT ON COLUMN ai_conversations.memory_summary IS 'Stores 1-2 sentence summary of earlier conversation context';
COMMENT ON COLUMN ai_conversations.total_tokens IS 'Tracks total token usage for the conversation';
COMMENT ON COLUMN ai_conversations.last_web_search_at IS 'Timestamp of last web search to avoid excessive searches';
COMMENT ON COLUMN ai_conversations.conversation_length IS 'Number of messages in the conversation';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_last_web_search 
ON ai_conversations(last_web_search_at);

CREATE INDEX IF NOT EXISTS idx_ai_conversations_total_tokens 
ON ai_conversations(total_tokens);

-- Create function to update conversation length
CREATE OR REPLACE FUNCTION update_conversation_length()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations 
  SET conversation_length = (
    SELECT COUNT(*) 
    FROM ai_messages 
    WHERE conversation_id = NEW.conversation_id
  )
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update conversation length
DROP TRIGGER IF EXISTS trigger_update_conversation_length ON ai_messages;
CREATE TRIGGER trigger_update_conversation_length
  AFTER INSERT OR DELETE ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_length();

-- Create function to estimate token usage
CREATE OR REPLACE FUNCTION estimate_tokens(text_content TEXT)
RETURNS INTEGER AS $$
BEGIN
  -- Rough estimation: 1 token ≈ 4 characters
  RETURN LENGTH(text_content) / 4;
END;
$$ LANGUAGE plpgsql;

-- Create view for conversation analytics
CREATE OR REPLACE VIEW ai_conversation_analytics AS
SELECT 
  c.id,
  c.user_id,
  c.article_id,
  c.title,
  c.created_at,
  c.conversation_length,
  c.total_tokens,
  c.last_web_search_at,
  CASE 
    WHEN c.last_web_search_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (NOW() - c.last_web_search_at)) / 60
    ELSE NULL 
  END as minutes_since_last_web_search,
  a.title as article_title,
  a.url as article_url
FROM ai_conversations c
JOIN articles a ON c.article_id = a.id;

-- Grant permissions
GRANT SELECT ON ai_conversation_analytics TO authenticated; 