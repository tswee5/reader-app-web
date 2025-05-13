-- Indexes for Articles table
CREATE INDEX idx_articles_user_id ON articles(user_id);
CREATE INDEX idx_articles_is_completed ON articles(user_id, is_completed);
CREATE INDEX idx_articles_last_read_at ON articles(user_id, last_read_at);
CREATE INDEX idx_articles_domain ON articles(user_id, domain);

-- Indexes for Highlights table
CREATE INDEX idx_highlights_user_id ON highlights(user_id);
CREATE INDEX idx_highlights_article_id ON highlights(article_id);
CREATE INDEX idx_highlights_created_at ON highlights(created_at);

-- Indexes for Notes table
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_article_id ON notes(article_id);
CREATE INDEX idx_notes_highlight_id ON notes(highlight_id);
CREATE INDEX idx_notes_created_at ON notes(created_at);

-- Indexes for Tags table
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_tags_name ON tags(user_id, name);

-- Indexes for Article_Tags table
CREATE INDEX idx_article_tags_article_id ON article_tags(article_id);
CREATE INDEX idx_article_tags_tag_id ON article_tags(tag_id);

-- Indexes for AI_Conversations table
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_article_id ON ai_conversations(article_id);
CREATE INDEX idx_ai_conversations_created_at ON ai_conversations(created_at);

-- Indexes for AI_Messages table
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created_at ON ai_messages(created_at); 