#!/usr/bin/env node

/**
 * Claude API Test Script
 * 
 * This script tests your Claude API key directly without going through Next.js.
 * It helps isolate whether the issue is with the API key itself or the application.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

// Get the API key from env variables
const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error('❌ No Claude API key found in .env.local file');
  console.error('Please make sure you have either CLAUDE_API_KEY or ANTHROPIC_API_KEY defined');
  process.exit(1);
}

console.log('🔑 API Key found in environment variables');
console.log(`Key length: ${apiKey.length} characters`);
console.log(`Key prefix: ${apiKey.substring(0, 5)}...`);

// Make a request to the models endpoint
console.log('\n🔍 Testing connection to Claude API...');

const options = {
  hostname: 'api.anthropic.com',
  port: 443,
  path: '/v1/models',
  method: 'GET',
  headers: {
    'anthropic-version': '2023-06-01',
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  }
};

const req = https.request(options, (res) => {
  console.log(`\n📡 API Response Status: ${res.statusCode}`);
  console.log(`📋 Response Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      // Try to parse the response as JSON
      const jsonData = JSON.parse(data);
      
      console.log('\n✅ Response successfully parsed as JSON');
      
      if (res.statusCode === 200) {
        console.log('\n🎉 Connection successful!');
        
        // Check for both old (models) and new (data) response formats
        const models = jsonData.data || jsonData.models;
        
        if (models && Array.isArray(models)) {
          console.log(`\n📚 Available models: ${models.length}`);
          models.forEach(model => {
            const modelName = model.display_name || model.name || model.id;
            const modelDesc = model.description || 
              `Created: ${model.created_at || 'unknown date'}`;
            console.log(`- ${model.id}: ${modelName} (${modelDesc.substring(0, 60)}${modelDesc.length > 60 ? '...' : ''})`);
          });
        } else {
          console.log('\n⚠️ Unexpected response format - no models array found');
          console.log('Response structure:');
          console.log(JSON.stringify(jsonData, null, 2).substring(0, 500) + '...');
        }
      } else {
        console.log('\n❌ API returned an error:');
        console.log(JSON.stringify(jsonData, null, 2));
      }
    } catch (e) {
      console.log('\n❌ Error parsing response:');
      console.error(e);
      console.log('\nRaw response:');
      console.log(data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request error:', error);
});

req.end();

console.log('\n⏳ Making request to Claude API...'); 