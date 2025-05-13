// Simple direct test to ElevenLabs API using node-fetch (ESM version)
import fetch from 'node-fetch';

// Use the same API key as in your config
const API_KEY = 'sk_cc8553bdf8a861e3eb568c5072f9c9d8d788e2ed27bc627d';

// Define constants exactly as specified in ElevenLabs API documentation
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1.1';
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel voice
const MODEL_ID = 'eleven_monolingual_v1';

// Function to test the voices endpoint (simplest GET request)
async function testVoicesEndpoint() {
  console.log('\n==== Testing Voices Endpoint ====');
  console.log('Making GET request to:', `${ELEVENLABS_API_URL}/voices`);
  console.log('Using API key (first 5 chars):', API_KEY.substring(0, 5));
  
  try {
    // Make the request with updated Authorization header
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('Success! Found', data.voices?.length, 'voices');
    return true;
  } catch (error) {
    console.error('Error making request:', error);
    return false;
  }
}

// Function to test text-to-speech endpoint
async function testTextToSpeech() {
  console.log('\n==== Testing Text-to-Speech Endpoint ====');
  console.log('Making POST request to:', `${ELEVENLABS_API_URL}/text-to-speech/${VOICE_ID}`);
  
  // Create the request body exactly as documented by ElevenLabs
  const requestBody = {
    text: 'This is a test of the ElevenLabs API using a direct fetch request.',
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75
    }
  };
  
  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  
  try {
    // Make the request with updated Authorization header
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }
    
    // If we get here, the request was successful
    const audioBuffer = await response.arrayBuffer();
    console.log('Success! Received audio data:', audioBuffer.byteLength, 'bytes');
    return true;
  } catch (error) {
    console.error('Error making request:', error);
    return false;
  }
}

// Function to test without the 'sk_' prefix
async function testWithoutSkPrefix() {
  if (!API_KEY.startsWith('sk_')) {
    console.log('API key does not start with sk_, skipping this test');
    return false;
  }
  
  const altApiKey = API_KEY.replace('sk_', '');
  console.log('\n==== Testing Without sk_ Prefix ====');
  console.log('Making GET request with alternative key format');
  console.log('Alternative key (first 5 chars):', altApiKey.substring(0, 5));
  
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${altApiKey}`,
        'Accept': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }
    
    const data = await response.json();
    console.log('Success with alternative key format! Found', data.voices?.length, 'voices');
    return true;
  } catch (error) {
    console.error('Error making request with alternative key:', error);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('==== ELEVENLABS API DIRECT TEST ====');
  console.log('API URL:', ELEVENLABS_API_URL);
  
  // Test 1: Voices endpoint
  const voicesSuccess = await testVoicesEndpoint();
  
  // Test 2: Try without sk_ prefix
  const altKeySuccess = await testWithoutSkPrefix();
  
  // Test 3: Text-to-speech endpoint (only if one of the previous tests succeeded)
  let ttsSuccess = false;
  if (voicesSuccess || altKeySuccess) {
    ttsSuccess = await testTextToSpeech();
  } else {
    console.log('\nSkipping TTS test since authentication failed');
  }
  
  // Summary
  console.log('\n==== TEST SUMMARY ====');
  console.log('Voices endpoint test:', voicesSuccess ? 'SUCCESS' : 'FAILED');
  console.log('Alternative key format test:', altKeySuccess ? 'SUCCESS' : 'FAILED');
  console.log('Text-to-speech test:', ttsSuccess ? 'SUCCESS' : 'FAILED');
  
  if (voicesSuccess || altKeySuccess) {
    console.log('\nRECOMMENDATION: Use the', voicesSuccess ? 'original' : 'alternative (without sk_ prefix)', 'key format in your application');
  } else {
    console.log('\nAll tests failed. Please check your ElevenLabs account for a valid API key.');
  }
}

// Run the tests
runAllTests(); 