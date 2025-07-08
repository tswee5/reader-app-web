# Enhanced Stateful AI Chat System

The Reader App now features an enhanced stateful AI chat system that provides a seamless and conversational experience with intelligent context management, web search integration, and token usage optimization.

## Overview

The enhanced AI chat system implements a sophisticated stateful conversation management approach that:

1. **Generates and stores article summaries** on first message
2. **Performs intelligent web searches** for additional context
3. **Maintains conversation memory** for long discussions
4. **Tracks token usage** to prevent API limits
5. **Optimizes performance** through smart caching and truncation

## Key Features

### 1. First Message Processing

When a user sends their first message in a conversation:

- **Article Analysis**: The system generates a comprehensive summary of the article content
- **Web Search**: Performs web search to gather relevant external information (3-5 snippets)
- **Context Storage**: Saves the summary and web snippets for future reference
- **Enhanced Response**: Provides a detailed response with additional context

### 2. Follow-up Message Intelligence

For subsequent messages:

- **Memory Summary**: Creates 1-2 sentence summaries of earlier conversation context
- **Smart Web Search**: Only triggers web search when needed (news, stats, current events)
- **Context Preservation**: Uses stored article summary and relevant web snippets
- **Token Optimization**: Manages conversation length to stay within limits

### 3. Token Management

The system includes sophisticated token management:

- **Real-time Tracking**: Monitors token usage throughout conversations
- **Automatic Truncation**: Removes older messages when approaching 90K limit
- **Warning System**: Alerts users when approaching token limits
- **Efficient Storage**: Optimizes context storage to minimize token usage

### 4. Web Search Intelligence

Smart web search capabilities:

- **Keyword Detection**: Automatically detects when web search is needed
- **Rate Limiting**: Prevents excessive searches (max once per 5 minutes)
- **Relevance Scoring**: Ranks search results by relevance
- **Context Integration**: Seamlessly integrates web results into responses

## Database Schema

### Enhanced `ai_conversations` Table

```sql
ALTER TABLE ai_conversations 
ADD COLUMN article_summary TEXT,
ADD COLUMN web_snippets JSONB,
ADD COLUMN memory_summary TEXT,
ADD COLUMN total_tokens INTEGER DEFAULT 0,
ADD COLUMN last_web_search_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN conversation_length INTEGER DEFAULT 0;
```

### New Analytics View

```sql
CREATE VIEW ai_conversation_analytics AS
SELECT 
  c.id,
  c.user_id,
  c.article_id,
  c.title,
  c.created_at,
  c.conversation_length,
  c.total_tokens,
  c.last_web_search_at,
  a.title as article_title,
  a.url as article_url
FROM ai_conversations c
JOIN articles a ON c.article_id = a.id;
```

## API Endpoints

### Enhanced `/api/ai/chat`

**Request:**
```json
{
  "conversationId": "optional-uuid",
  "currentMessage": "User's message",
  "articleId": "article-uuid",
  "article": {
    "content": "Article content",
    "id": "article-uuid"
  },
  "conversationHistory": []
}
```

**Response:**
```json
{
  "response": "AI's response",
  "conversationId": "conversation-uuid",
  "conversationState": {
    "article_summary": "Generated summary",
    "web_snippets": [...],
    "memory_summary": "Context summary",
    "total_tokens": 15000,
    "conversation_length": 5,
    "last_web_search_at": "2024-01-01T12:00:00Z"
  },
  "webSnippets": [...],
  "tokenUsage": 15000,
  "isFirstMessage": false
}
```

## Utility Functions

### Token Management

```typescript
// Estimate token count
estimateTokens(text: string): number

// Check if approaching limits
isApproachingTokenLimit(totalTokens: number): boolean

// Truncate conversation history
truncateConversationHistory(messages: ChatMessage[], maxTokens: number): ChatMessage[]
```

### Web Search Intelligence

```typescript
// Detect if web search is needed
requiresWebSearch(message: string): boolean

// Check if web search should be performed
shouldPerformWebSearch(lastWebSearchAt?: string): boolean

// Extract web snippets from Claude response
extractWebSnippets(claudeResponse: any): WebSnippet[]
```

### Conversation Management

```typescript
// Generate memory summary
generateMemorySummary(messages: ChatMessage[]): string

// Build system prompt
buildSystemPrompt(isFirstMessage: boolean, articleSummary?: string, webSnippets?: WebSnippet[], memorySummary?: string): string
```

## Usage Examples

### Basic Chat Integration

```typescript
import { AIChatService } from '@/lib/ai/chat-service';

const response = await AIChatService.processMessage({
  conversationId: 'existing-conversation-id',
  message: 'What are the main points of this article?',
  articleId: 'article-uuid',
  articleContent: 'Full article content...',
  articleUrl: 'https://example.com/article',
  userId: 'user-uuid'
});

console.log('AI Response:', response.response);
console.log('Token Usage:', response.tokenUsage);
console.log('Is First Message:', response.isFirstMessage);
```

### Conversation State Monitoring

```typescript
import { ConversationStateIndicator } from '@/components/articles/ai/conversation-state-indicator';

<ConversationStateIndicator
  conversationState={response.conversationState}
  isFirstMessage={response.isFirstMessage}
/>
```

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=your_claude_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional
CLAUDE_API_KEY=alternative_claude_key_name
```

### Token Limits

```typescript
const TOKEN_LIMIT = 90000; // 90K token limit
const WARNING_THRESHOLD = 0.8; // 80% of limit
const WEB_SEARCH_COOLDOWN = 5; // minutes between web searches
```

## Migration

To upgrade to the enhanced system:

1. **Run the migration script:**
   ```bash
   node scripts/run-ai-migration.js
   ```

2. **Update your environment variables**

3. **Restart your development server**

4. **Test the new features**

## Performance Optimizations

### Token Efficiency

- **Smart Truncation**: Removes oldest messages when approaching limits
- **Context Compression**: Stores summaries instead of full content
- **Memory Summaries**: Condenses long conversation history

### Web Search Optimization

- **Rate Limiting**: Prevents excessive API calls
- **Relevance Filtering**: Only searches when contextually relevant
- **Result Caching**: Stores and reuses relevant search results

### Database Optimization

- **Indexed Queries**: Fast lookups for conversation state
- **JSONB Storage**: Efficient storage of web snippets
- **Analytics Views**: Pre-computed conversation insights

## Monitoring and Analytics

### Conversation Analytics

The system provides insights into:

- **Token Usage Patterns**: Track usage across conversations
- **Web Search Frequency**: Monitor search patterns
- **Conversation Length**: Analyze engagement metrics
- **Performance Metrics**: Response times and success rates

### Error Handling

Comprehensive error handling for:

- **API Rate Limits**: Automatic retry with backoff
- **Token Limit Exceeded**: Graceful truncation and warnings
- **Web Search Failures**: Fallback to stored context
- **Database Errors**: Robust error recovery

## Best Practices

### For Developers

1. **Monitor Token Usage**: Use the conversation state to track usage
2. **Handle Rate Limits**: Implement proper error handling for API limits
3. **Optimize Context**: Keep conversations focused and relevant
4. **Test Web Search**: Verify search functionality with various queries

### For Users

1. **Start with Clear Questions**: First messages should be specific
2. **Monitor Token Warnings**: Start new conversations when approaching limits
3. **Use Follow-up Questions**: Build on previous context for better responses
4. **Leverage Web Search**: Ask for current information when needed

## Troubleshooting

### Common Issues

**High Token Usage:**
- Check conversation length
- Consider starting new conversations
- Review stored context size

**Web Search Not Working:**
- Verify API key configuration
- Check rate limiting
- Ensure search keywords are detected

**Slow Responses:**
- Monitor token usage
- Check web search frequency
- Review conversation complexity

### Debug Information

Enable debug logging:

```typescript
console.log('Conversation state:', response.conversationState);
console.log('Token usage:', response.tokenUsage);
console.log('Web snippets:', response.webSnippets);
```

## Future Enhancements

Planned improvements include:

- **Advanced Memory Management**: More sophisticated conversation summarization
- **Multi-modal Support**: Image and document analysis
- **Personalization**: User-specific conversation preferences
- **Advanced Analytics**: Detailed usage insights and recommendations
- **Real-time Collaboration**: Shared conversation contexts 