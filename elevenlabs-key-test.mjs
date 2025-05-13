#!/usr/bin/env node

/**
 * This script tests different formats of ElevenLabs API keys
 * to diagnose authentication issues with the ElevenLabs API.
 */

// API key with and without the 'sk_' prefix
const API_KEY_WITH_PREFIX = 'sk_cc8553bdf8a861e3eb568c5072f9c9d8d788e2ed27bc627d';
const API_KEY_WITHOUT_PREFIX = 'cc8553bdf8a861e3eb568c5072f9c9d8d788e2ed27bc627d';

// Updated ElevenLabs API URL
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1.1";

// Default voice ID for testing (Rachel)
const TEST_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

// Utility to log the response in a structured way
async function logResponse(response, label) {
  const status = response.status;
  const statusText = response.statusText;
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  console.log(`\n${label} Response:`);
  console.log(`Status: ${status} ${statusText}`);
  console.log('Headers:', headers);
  
  if (!response.ok) {
    try {
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      return { success: false, status, errorBody };
    } catch (e) {
      console.error('Failed to parse error body:', e);
      return { success: false, status, error: e.message };
    }
  } else {
    const contentType = response.headers.get('content-type');
    console.log('Content type:', contentType);
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const json = await response.json();
        console.log('Response body (JSON):', json);
        return { success: true, status, data: json };
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        return { success: true, status, error: e.message };
      }
    } else if (contentType && contentType.includes('audio')) {
      const buffer = await response.arrayBuffer();
      console.log(`Audio data received: ${buffer.byteLength} bytes`);
      return { success: true, status, dataSize: buffer.byteLength };
    } else {
      const text = await response.text();
      console.log(`Response body (text): ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
      return { success: true, status, data: text };
    }
  }
}

// Test the voices endpoint with both key formats
async function testVoicesEndpoint() {
  console.log('\n=== Testing Voices Endpoint ===');
  
  // Test with 'sk_' prefix
  console.log('\nTesting with sk_ prefix:');
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY_WITH_PREFIX}`,
        'Accept': 'application/json'
      }
    });
    
    await logResponse(response, 'With sk_ prefix');
  } catch (error) {
    console.error('Request error with sk_ prefix:', error);
  }
  
  // Test without 'sk_' prefix
  console.log('\nTesting without sk_ prefix:');
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY_WITHOUT_PREFIX}`,
        'Accept': 'application/json'
      }
    });
    
    await logResponse(response, 'Without sk_ prefix');
  } catch (error) {
    console.error('Request error without sk_ prefix:', error);
  }
}

// Test text-to-speech endpoint with both key formats
async function testTextToSpeech() {
  console.log('\n=== Testing Text-to-Speech Endpoint ===');
  const testText = "This is a test of the ElevenLabs API.";
  const requestBody = {
    text: testText,
    model_id: "eleven_monolingual_v1",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  };
  
  // Test with 'sk_' prefix
  console.log('\nTesting TTS with sk_ prefix:');
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${TEST_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY_WITH_PREFIX}`,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(requestBody)
    });
    
    await logResponse(response, 'TTS with sk_ prefix');
  } catch (error) {
    console.error('TTS request error with sk_ prefix:', error);
  }
  
  // Test without 'sk_' prefix
  console.log('\nTesting TTS without sk_ prefix:');
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${TEST_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY_WITHOUT_PREFIX}`,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify(requestBody)
    });
    
    await logResponse(response, 'TTS without sk_ prefix');
  } catch (error) {
    console.error('TTS request error without sk_ prefix:', error);
  }
}

// Run the tests
async function runAllTests() {
  console.log('ElevenLabs API Key Testing Tool');
  console.log('===============================');
  console.log('Testing key formats:');
  console.log(`- With 'sk_' prefix: ${API_KEY_WITH_PREFIX.substring(0, 10)}...`);
  console.log(`- Without 'sk_' prefix: ${API_KEY_WITHOUT_PREFIX.substring(0, 10)}...`);
  
  await testVoicesEndpoint();
  await testTextToSpeech();
  
  console.log('\n=== Test Summary ===');
  console.log('Tests completed. Please check the results above to determine which key format works with ElevenLabs API.');
  console.log('If neither format works, your key may be expired, revoked, or incorrect.');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
}); 