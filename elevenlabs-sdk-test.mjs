#!/usr/bin/env node

/**
 * This script tests the ElevenLabs SDK with different API key formats
 * to diagnose authentication issues.
 */

import { VoiceGeneration, TextToSpeech, getVoices } from '@elevenlabs/api';

// API key with and without the 'sk_' prefix
const API_KEY_WITH_PREFIX = 'sk_cc8553bdf8a861e3eb568c5072f9c9d8d788e2ed27bc627d';
const API_KEY_WITHOUT_PREFIX = 'cc8553bdf8a861e3eb568c5072f9c9d8d788e2ed27bc627d';

// Default voice ID for testing (Rachel)
const TEST_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const TEST_TEXT = "This is a test of the ElevenLabs SDK.";

/**
 * Tests the getVoices SDK function with both key formats
 */
async function testGetVoices() {
  console.log('\n=== Testing SDK getVoices Function ===');
  
  // Test with 'sk_' prefix
  console.log('\nTesting with sk_ prefix:');
  try {
    const voices = await getVoices({
      apiKey: API_KEY_WITH_PREFIX
    });
    console.log(`Success! Found ${voices.length} voices.`);
    console.log('First voice:', voices[0].name, voices[0].voice_id);
  } catch (error) {
    console.error('SDK error with sk_ prefix:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  // Test without 'sk_' prefix
  console.log('\nTesting without sk_ prefix:');
  try {
    const voices = await getVoices({
      apiKey: API_KEY_WITHOUT_PREFIX
    });
    console.log(`Success! Found ${voices.length} voices.`);
    console.log('First voice:', voices[0].name, voices[0].voice_id);
  } catch (error) {
    console.error('SDK error without sk_ prefix:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

/**
 * Tests the TextToSpeech SDK function with both key formats
 */
async function testTextToSpeech() {
  console.log('\n=== Testing SDK TextToSpeech Function ===');
  
  // Test with 'sk_' prefix
  console.log('\nTesting TTS with sk_ prefix:');
  try {
    const audioStream = await TextToSpeech({
      apiKey: API_KEY_WITH_PREFIX,
      voiceId: TEST_VOICE_ID,
      text: TEST_TEXT,
      modelId: "eleven_monolingual_v1",
      voiceSettings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    });
    
    if (audioStream) {
      // Check the type of audioStream
      console.log('Success! Audio stream type:', typeof audioStream);
      if (audioStream instanceof ArrayBuffer) {
        console.log(`Audio data size: ${audioStream.byteLength} bytes`);
      } else if (typeof audioStream === 'object') {
        console.log('Audio stream object keys:', Object.keys(audioStream));
      }
    } else {
      console.log('Warning: Received empty audio stream');
    }
  } catch (error) {
    console.error('TTS SDK error with sk_ prefix:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  // Test without 'sk_' prefix
  console.log('\nTesting TTS without sk_ prefix:');
  try {
    const audioStream = await TextToSpeech({
      apiKey: API_KEY_WITHOUT_PREFIX,
      voiceId: TEST_VOICE_ID,
      text: TEST_TEXT,
      modelId: "eleven_monolingual_v1",
      voiceSettings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    });
    
    if (audioStream) {
      // Check the type of audioStream
      console.log('Success! Audio stream type:', typeof audioStream);
      if (audioStream instanceof ArrayBuffer) {
        console.log(`Audio data size: ${audioStream.byteLength} bytes`);
      } else if (typeof audioStream === 'object') {
        console.log('Audio stream object keys:', Object.keys(audioStream));
      }
    } else {
      console.log('Warning: Received empty audio stream');
    }
  } catch (error) {
    console.error('TTS SDK error without sk_ prefix:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

/**
 * Tests the VoiceGeneration SDK function with both key formats
 */
async function testVoiceGeneration() {
  console.log('\n=== Testing SDK VoiceGeneration Function ===');
  
  const options = {
    name: "Test Voice",
    description: "A test voice for diagnostic purposes",
    files: [], // Skip actual voice cloning as it would require audio files
  };
  
  // Test with 'sk_' prefix 
  console.log('\nTesting VoiceGeneration API check with sk_ prefix:');
  try {
    // We're not actually generating a voice, just checking if the API key works
    // by validating connection to the cloning endpoint
    const response = await VoiceGeneration.validateConnection({
      apiKey: API_KEY_WITH_PREFIX,
    });
    console.log('Connection validation success!', response);
  } catch (error) {
    console.error('Voice Generation API check error with sk_ prefix:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
  
  // Test without 'sk_' prefix
  console.log('\nTesting VoiceGeneration API check without sk_ prefix:');
  try {
    // We're not actually generating a voice, just checking if the API key works
    const response = await VoiceGeneration.validateConnection({
      apiKey: API_KEY_WITHOUT_PREFIX,
    });
    console.log('Connection validation success!', response);
  } catch (error) {
    console.error('Voice Generation API check error without sk_ prefix:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run all tests
async function runAllTests() {
  console.log('ElevenLabs SDK Testing Tool');
  console.log('===========================');
  console.log('Testing key formats:');
  console.log(`- With 'sk_' prefix: ${API_KEY_WITH_PREFIX.substring(0, 10)}...`);
  console.log(`- Without 'sk_' prefix: ${API_KEY_WITHOUT_PREFIX.substring(0, 10)}...`);
  
  await testGetVoices();
  await testTextToSpeech();
  await testVoiceGeneration();
  
  console.log('\n=== Test Summary ===');
  console.log('SDK tests completed. Please check the results above to determine which key format works with the ElevenLabs SDK.');
  console.log('If neither format works, your key may be expired, revoked, or incorrect.');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
}); 