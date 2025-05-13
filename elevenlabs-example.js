// Complete example of using the ElevenLabs SDK
const { ElevenLabsClient } = require('elevenlabs');

// Replace with your actual API key
const API_KEY = 'sk_414bbc984d5e2710a43fac8bb409301d47720d3d1b816dc';

async function testElevenLabsSDK() {
  try {
    console.log('Creating ElevenLabs client...');
    const client = new ElevenLabsClient({
      apiKey: API_KEY,
    });

    // 1. List all available voices
    console.log('Fetching available voices...');
    const voices = await client.voices.getAll();
    console.log(`Found ${voices.voices.length} voices`);
    
    // Print some voice details
    if (voices.voices.length > 0) {
      const firstVoice = voices.voices[0];
      console.log('Sample voice:', {
        id: firstVoice.voice_id,
        name: firstVoice.name,
      });
    }

    // 2. Convert text to speech
    const voiceId = '21m00Tcm4TlvDq8ikWAM'; // Default Rachel voice
    const text = 'Hello, this is a test of the ElevenLabs API using their official SDK.';
    
    console.log(`Converting text to speech using voice ID: ${voiceId}...`);
    
    // Check what methods are available on the client
    console.log('Available methods on client:');
    console.log(Object.keys(client));
    
    // Check if textToSpeech is available
    if (client.textToSpeech) {
      console.log('textToSpeech method exists, attempting to use it...');
    } else {
      console.log('textToSpeech method not found! Checking for other TTS methods...');
      
      // See if there's a tts module
      if (client.tts) {
        console.log('tts module found!');
        console.log('Methods in tts module:', Object.keys(client.tts));
      }
      
      // Check for generation methods
      if (client.generation) {
        console.log('generation module found!');
        console.log('Methods in generation module:', Object.keys(client.generation));
      }
    }
    
    // Try different ways to use the API based on available methods
    let audioResponse;
    
    if (client.textToSpeech) {
      audioResponse = await client.textToSpeech({
        voiceId,
        textInput: text
      });
    } else if (client.tts && client.tts.convert) {
      audioResponse = await client.tts.convert({
        voiceId,
        text
      });
    } else if (client.generation && client.generation.textToSpeech) {
      audioResponse = await client.generation.textToSpeech({
        voiceId,
        text
      });
    } else {
      throw new Error('Could not find any text-to-speech method in the SDK');
    }
    
    if (audioResponse) {
      console.log('Successfully generated speech!');
      console.log('Response type:', typeof audioResponse);
      
      // Check if it's a Response object or a Buffer
      if (audioResponse instanceof Response) {
        console.log('Got a Response object, checking content type:', audioResponse.headers.get('content-type'));
        
        // Get the audio data as an ArrayBuffer
        const audioBuffer = await audioResponse.arrayBuffer();
        console.log(`Received ${audioBuffer.byteLength} bytes of audio data`);
      } else if (audioResponse instanceof Buffer || audioResponse instanceof ArrayBuffer) {
        console.log(`Received ${audioResponse.byteLength} bytes of audio data directly`);
      } else {
        console.log('Unknown response format:', audioResponse);
      }
    }
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error in ElevenLabs SDK test:', error);
  }
}

// Run the test
testElevenLabsSDK(); 