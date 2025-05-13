# API Keys Configuration

This guide explains how to set up and manage the necessary API keys for Reader App's AI and text-to-speech features.

## Required API Keys

The Reader App uses the following external services that require API keys:

1. **Claude AI** - For article summarization and question answering
2. **ElevenLabs** - For converting article text to speech with high-quality voices

## Local Development Setup

For local development, add your API keys to a `.env.local` file in the project root:

```
# Claude AI
CLAUDE_API_KEY=your_claude_api_key_here

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

## Claude AI Setup

1. **Create an Anthropic account**:
   - Sign up at [Anthropic](https://www.anthropic.com/)
   - Navigate to the [Claude API Console](https://console.anthropic.com/)

2. **Generate an API key**:
   - In the Claude API Console, create a new API key
   - Copy the key and add it to your environment variables
   - Note: Claude API keys typically start with `sk-ant-api...`

3. **Usage limits**:
   - Be aware of your current Claude API usage limits and pricing
   - Monitor your usage through the Anthropic dashboard

## ElevenLabs Setup

1. **Create an ElevenLabs account**:
   - Sign up at [ElevenLabs](https://elevenlabs.io/)
   - You can start with the free tier, which includes limited character quotas
   
2. **Generate an API key**:
   - Navigate to your Profile Settings in the ElevenLabs dashboard
   - Go to the "API" section
   - Create a new API key 
   - Copy the key and add it to your environment variables
   
3. **Voice selection**:
   - ElevenLabs provides several premade voices
   - The default voice ID in our application is "21m00Tcm4TlvDq8ikWAM" (Rachel)
   - You can find other voice IDs in your ElevenLabs dashboard under "Voice Library"
   - You can also create custom voices with your own voice samples

4. **Usage limits and monitoring**:
   - Check your character quota in the ElevenLabs dashboard
   - Monitor your usage to stay within limits
   - Consider upgrading your plan for higher character limits if needed

## Production Environment Setup

For production deployments, add the API keys to your hosting platform's environment variables:

### Vercel
1. Go to your project settings
2. Navigate to the "Environment Variables" section
3. Add the required variables
4. Deploy your application

### Netlify
1. Go to your site settings
2. Navigate to "Build & deploy" > "Environment variables"
3. Add the required variables
4. Trigger a new deploy

## Security Best Practices

1. **Never commit API keys to source control**
   - Ensure `.env.local` is in your `.gitignore` file
   - Use environment variables instead of hardcoding values

2. **Use restricted permissions**
   - For ElevenLabs, consider creating API keys with limited permissions if available
   - For Claude API, use the minimum required permissions

3. **Regularly rotate keys**
   - Periodically generate new keys and update your environment variables
   - Revoke old keys after updating to new ones

4. **Monitor for abnormal usage**
   - Set up alerts for unusual API usage patterns
   - Regularly check your usage dashboards

5. **Implement rate limiting**
   - Protect your API endpoints from abuse with rate limiting
   - Ensure your implementation gracefully handles API limits

## Troubleshooting

If you encounter issues with API keys:

1. **Check environment variables**:
   - Ensure the keys are correctly set in your environment
   - Verify there are no typos or extra spaces

2. **Verify API access**:
   - Test your keys with curl or Postman
   - Check if you have the correct permissions

3. **Review logs**:
   - Check your application logs for API-related errors
   - Look for "unauthorized" or "authentication" errors

4. **Check quota status**:
   - ElevenLabs has character limits that vary by plan
   - Ensure you haven't exceeded your quota
   - Check your Anthropic Claude usage limits 