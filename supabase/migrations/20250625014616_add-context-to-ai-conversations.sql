-- Add a context column to store article content/context for the conversation
ALTER TABLE ai_conversations ADD COLUMN context TEXT NULL;
-- Optionally, you can add a comment for clarity
COMMENT ON COLUMN ai_conversations.context IS 'Stores article content or context for the conversation';
