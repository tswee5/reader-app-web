# Text-to-Speech Feature

The Reader App includes a text-to-speech feature powered by ElevenLabs, allowing users to listen to articles rather than reading them.

## Overview

The text-to-speech functionality converts article text into natural-sounding speech. This feature is particularly useful for:

- Users who prefer listening over reading
- Multitasking while consuming content
- Accessibility for users with visual impairments
- Learning pronunciation of unfamiliar words

## How It Works

1. The article content is divided into chunks to accommodate API limits
2. Each chunk is sent to the ElevenLabs API when needed
3. The API returns audio data which is played in sequence
4. Users can control playback, volume, and voice selection

## Implementation Details

### Components

- `ArticleSpeechPlayer`: The main UI component that provides controls for text-to-speech playback
- `/api/tts`: The API endpoint that communicates with ElevenLabs

### Workflow

1. When a user clicks play:
   - The article content is split into manageable chunks
   - The first chunk is sent to the API
   - The returned audio is played

2. When a chunk finishes playing:
   - The next chunk is automatically requested
   - Playback continues seamlessly

3. User controls:
   - Play/Pause: Start or pause playback
   - Volume: Adjust audio level
   - Voice Selection: Choose from available ElevenLabs voices

### Voice Options

The application provides access to several voices from ElevenLabs:

| Voice ID | Name | Description |
|----------|------|-------------|
| 21m00Tcm4TlvDq8ikWAM | Rachel | Default female voice, clear and natural |
| AZnzlk1XvdvUeBnXmlld | Domi | Female voice with a warm tone |
| EXAVITQu4vr4xnSDxMaL | Bella | Female voice with a friendly character |
| ErXwobaYiN019PkySvjV | Antoni | Male voice with a mild accent |
| MF3mGyEYCl7XYWbV9V6O | Elli | Female voice with a soft tone |
| TxGEqnHWrfWFTfGW9XjX | Josh | Male voice with a deep tone |
| VR6AewLTigWG4xSOukaG | Arnold | Male voice with a strong character |
| pNInz6obpgDQGcFmaJgB | Adam | Male voice with a neutral tone |
| yoZ06aMxZJJ28mfd3POQ | Sam | Male voice with a friendly character |

## Technical Implementation

### API Endpoint

The `/api/tts` endpoint handles communication with ElevenLabs:

```typescript
// POST /api/tts
// Request body:
{
  "articleId": "uuid-string",
  "text": "Text to convert to speech",
  "voiceId": "21m00Tcm4TlvDq8ikWAM", // Optional, defaults to Rachel
  "model": "eleven_monolingual_v1" // Optional
}

// Response:
{
  "audioContent": "base64-encoded-audio-data",
  "format": "MP3"
}
```

### Performance Considerations

1. **Chunking**: Long articles are divided into chunks of approximately 4,000 characters to:
   - Stay within API limits
   - Reduce initial load time
   - Allow for faster response

2. **Caching**: Frequently accessed audio could be cached to:
   - Reduce API calls
   - Lower costs
   - Improve performance

3. **Progressive Loading**: Audio chunks are loaded progressively as needed rather than all at once.

## Usage Limits and Quotas

ElevenLabs provides different pricing tiers with character limits:

- Free tier: 10,000 characters/month
- Starter tier: 30,000 characters/month
- Creator tier: 100,000 characters/month
- Pro tier: 200,000 characters/month

The application tracks usage in the `tts_requests` table to monitor character consumption.

## Database Schema

```sql
CREATE TABLE tts_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  article_id UUID NOT NULL REFERENCES articles(id),
  text_length INTEGER NOT NULL,
  voice VARCHAR(255) NOT NULL,
  model VARCHAR(255),
  stability FLOAT,
  similarity_boost FLOAT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

## Setup Requirements

1. ElevenLabs API key (see [API Keys Configuration](./api-keys.md))
2. Environment variable configuration:
   ```
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ```

## Future Enhancements

- Caching of generated audio to reduce API calls
- Speed control for playback rate adjustment
- Highlighting text as it's being read
- Custom voice creation with user samples
- Background audio continuation when switching to other tabs 