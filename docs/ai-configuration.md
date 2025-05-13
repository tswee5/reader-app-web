# AI Integration Configuration Guide

This document provides instructions for setting up and troubleshooting AI integrations in the Reader App.

## Claude API Configuration

The application uses Claude by Anthropic for AI summarization and other features. Follow these steps to set up the API integration:

### Getting an API Key

1. Go to [Anthropic's Console](https://console.anthropic.com/)
2. Create an account or sign in to your existing account
3. Navigate to the API Keys section
4. Create a new API key and copy it

### Setting Up Your API Key

You have two options for setting up your Claude API key:

#### Option 1: Using the CLI Tool (Recommended)

Run the following command from the project root:

```bash
npm run update-claude-key
```

This will prompt you for your API key and automatically update your .env.local file.

#### Option 2: Manual Configuration

1. Create or edit the `.env.local` file in the project root directory
2. Add your Claude API key:

```
CLAUDE_API_KEY=your-api-key-here
```

### API Key Format

The application uses the x-api-key authentication method to connect to Claude's API. Your API key should be a long alphanumeric string provided by Anthropic.

### Troubleshooting API Key Issues

If you're experiencing issues with Claude API integration:

1. **Check your API key**: Make sure you've entered the complete key correctly
2. **Verify your Claude account status**: Ensure your account is active and has available credits
3. **Use the debug tools**: Visit `/debug/auth` in the application to test your API connection

#### Common Error Messages

- **"invalid x-api-key"**: Your API key is not recognized or is formatted incorrectly
- **"permission_denied"**: Your API key doesn't have permission to use the requested model

### Testing Your Configuration

After setting up your API key, you can test it by:

1. Going to `/debug/auth` in the application 
2. Clicking the "Test Claude API" button
3. Checking the response for successful connection

If successful, you should see the available Claude models displayed. If not, the error details will help you troubleshoot.

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `CLAUDE_API_KEY` | Your Claude API key | `abc123def456ghi789` |
| `ANTHROPIC_API_KEY` | Alternative name for Claude API key (also supported) | `abc123def456ghi789` |

## Updating the Integration

When Anthropic releases new versions of their API or models, you may need to update the integration. Watch for announcements about new Claude models or API versions and update the code as needed. 

## Testing with CURL

If you want to test your API key directly from the command line, you can use curl:

```bash
curl https://api.anthropic.com/v1/models \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

Replace `YOUR_API_KEY` with your actual API key. If successful, you should see a list of available Claude models. 