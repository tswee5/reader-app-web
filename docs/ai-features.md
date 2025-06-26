# AI Features in Reader App

The Reader App integrates Claude AI to provide intelligent features that enhance the reading experience.

## Available AI Features

### Article Question Answerer

The Article Question Answerer allows users to ask questions about the content of an article they're reading. The AI provides answers based on the article content, making it easier to understand complex topics or find specific information.

### Article Summarizer

The Article Summarizer generates concise summaries of articles, highlighting key points and main ideas. This is useful for quickly understanding what an article is about before diving in or for refreshing your memory about previously read content.

## Setup Instructions

To use AI features in the Reader App, you need to configure your environment with the appropriate API keys.

### Claude AI Setup

1. Create an account at [Anthropic](https://www.anthropic.com/) if you don't already have one
2. Navigate to the [Claude API Console](https://console.anthropic.com/)
3. Create a new API key
4. Copy the API key

### Environment Configuration

Add the following values to your `.env.local` file:

```
CLAUDE_API_KEY=your_claude_api_key_here
```

For production environments, add this to your hosting provider's environment variables.

For detailed instructions on setting up API keys, please refer to the [API Keys Configuration](./api-keys.md) documentation.

## Database Schema

The AI features use the following tables:

### ai_interactions

Stores user interactions with the AI, including questions and answers.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| article_id | UUID | Foreign key to articles |
| user_query | TEXT | The user's question |
| ai_response | TEXT | The AI's response |
| created_at | TIMESTAMP | When the interaction occurred |

## API Endpoints

### POST /api/ai/chat

Used by the Article Question Answerer to send user questions to Claude and receive answers.

**Request Body:**
```json
{
  "articleId": "uuid-of-article",
  "content": "Full article content",
  "message": "User's question",
  "conversation": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}
```

**Response:**
```json
{
  "response": "AI's answer to the question"
}
```

### POST /api/ai/summarize

Used by the Article Summarizer to generate article summaries.

**Request Body:**
```json
{
  "articleId": "uuid-of-article",
  "content": "Full article content"
}
```

**Response:**
```json
{
  "summary": "Generated summary of the article"
}
```

## Best Practices

1. **Hybrid Content Approach**: The application uses a smart hybrid approach that:
   - First attempts to use the article URL for cost-efficient AI processing
   - Falls back to sending article content if the URL is not accessible
   - Automatically handles very long articles without content loss
   - Reduces API costs while maintaining full functionality

2. **Error Handling**: All AI features have proper error handling to provide a good user experience even when the AI service is unavailable.

3. **Conversation Tracking**: The application stores user-AI interactions in the database, which can be used for improving the service and providing context for future interactions.

## Troubleshooting

If you encounter issues with the AI features:

1. Verify your API key is correctly set in the environment variables
2. Check the console for error messages
3. Ensure you have sufficient API credits in your Claude account
4. For very long articles, try breaking your questions into smaller, more specific queries 

## Hybrid Content Approach

The Reader App implements an intelligent approach for AI interactions that leverages Claude's web search tool for optimal performance:

### How It Works

1. **Web Search Tool**: When an article has a public URL, Claude uses its built-in web search tool to directly access and analyze the article content
2. **Automatic Fallback**: If the web search cannot access the URL (due to paywalls, authentication, etc.), it automatically falls back to using the full article content
3. **No Content Loss**: Unlike simple truncation, this approach ensures the AI always has access to the complete article content
4. **Cost Optimization**: Using web search when possible reduces token usage and API costs

### Benefits

- **Lower API Costs**: Web search requests use fewer tokens than sending full content
- **Better Performance**: Faster response times for articles with accessible URLs
- **Full Coverage**: No content is lost, even for very long articles
- **Automatic Handling**: Users don't need to worry about content length limits
- **Real-time Access**: Claude can access the most up-to-date version of articles

### Technical Implementation

The system uses Claude's web search tool (`web_search_20250305`) which is available on:
- Claude Opus 4 (`claude-opus-4-20250514`)
- Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- Claude Sonnet 3.7 (`claude-3-7-sonnet-20250219`)
- Claude Sonnet 3.5 (new) (`claude-3-5-sonnet-latest`)
- Claude Haiku 3.5 (`claude-3-5-haiku-latest`)

The system detects when web search cannot access a URL and automatically retries with the full article content. This ensures seamless user experience regardless of the article's accessibility. 