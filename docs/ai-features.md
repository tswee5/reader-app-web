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

1. **Content Truncation**: The application automatically truncates very long articles to 8,000 characters when sending to the AI to prevent API limits from being reached.

2. **Error Handling**: All AI features have proper error handling to provide a good user experience even when the AI service is unavailable.

3. **Conversation Tracking**: The application stores user-AI interactions in the database, which can be used for improving the service and providing context for future interactions.

## Troubleshooting

If you encounter issues with the AI features:

1. Verify your API key is correctly set in the environment variables
2. Check the console for error messages
3. Ensure you have sufficient API credits in your Claude account
4. For very long articles, try breaking your questions into smaller, more specific queries 