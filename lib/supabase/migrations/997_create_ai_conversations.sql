-- Create AI conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX ai_conversations_user_id_idx ON ai_conversations(user_id);
CREATE INDEX ai_conversations_article_id_idx ON ai_conversations(article_id);
CREATE INDEX ai_conversations_created_at_idx ON ai_conversations(created_at);

-- Enable Row Level Security
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_conversations
CREATE POLICY "Users can view their own ai conversations" 
  ON ai_conversations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ai conversations" 
  ON ai_conversations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ai conversations" 
  ON ai_conversations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ai conversations" 
  ON ai_conversations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create AI messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX ai_messages_conversation_id_idx ON ai_messages(conversation_id);
CREATE INDEX ai_messages_created_at_idx ON ai_messages(created_at);

-- Enable Row Level Security
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_messages - join to conversations to verify ownership
CREATE POLICY "Users can view their own ai messages" 
  ON ai_messages 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations c 
      WHERE c.id = ai_messages.conversation_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own ai messages" 
  ON ai_messages 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations c 
      WHERE c.id = ai_messages.conversation_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own ai messages" 
  ON ai_messages 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations c 
      WHERE c.id = ai_messages.conversation_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own ai messages" 
  ON ai_messages 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations c 
      WHERE c.id = ai_messages.conversation_id 
      AND c.user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_messages TO authenticated; 