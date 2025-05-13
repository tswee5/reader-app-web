/**
 * Script to test available Claude models
 * 
 * Run this script to check which Claude models are currently available
 * with your API key and verify the correct model names.
 */

require('dotenv').config({ path: '.env.local' });

// Define models directly here since we can't import TypeScript modules
const CLAUDE_MODELS = {
  // Most powerful model - best for complex reasoning
  OPUS: 'claude-3-opus-20240229',
  
  // Balanced model - good general purpose usage
  SONNET: 'claude-3-5-sonnet-20241022',  // Latest version (Oct 2024)
  SONNET_OLD: 'claude-3-5-sonnet-20240620', // Previous version
  
  // Fastest and most economical model
  HAIKU: 'claude-3-5-haiku-20241022',
  HAIKU_OLD: 'claude-3-haiku-20240307',
  
  // Experimental model with higher capabilities
  SONNET_NEXT: 'claude-3-7-sonnet-20250219'
};

// Get the latest API version to use with Claude
const getClaudeApiVersion = () => '2023-06-01';

const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

if (!CLAUDE_API_KEY) {
  console.error('No Claude API key found in .env.local file');
  console.error('Please make sure you have either CLAUDE_API_KEY or ANTHROPIC_API_KEY defined');
  process.exit(1);
}

// Test different API versions
const apiVersions = [
  getClaudeApiVersion() // Use the recommended version
];

// Test different model formats
const modelTests = [
  CLAUDE_MODELS.SONNET,
  CLAUDE_MODELS.OPUS,
  CLAUDE_MODELS.HAIKU,
  CLAUDE_MODELS.SONNET_OLD,
  CLAUDE_MODELS.HAIKU_OLD,
  CLAUDE_MODELS.SONNET_NEXT
];

/**
 * Fetch available models from Claude API
 */
async function fetchModels(apiVersion) {
  console.log(`\nTesting with API version: ${apiVersion}`);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      method: 'GET',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': apiVersion
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Models endpoint successful');
      console.log('Available models:');
      data.models.forEach(model => {
        console.log(`- ${model.name}`);
      });
      return data.models.map(model => model.name);
    } else {
      const errorText = await response.text();
      console.error(`❌ Error fetching models: ${response.status} ${response.statusText}`);
      console.error(errorText);
      return null;
    }
  } catch (error) {
    console.error(`❌ Exception when fetching models: ${error.message}`);
    return null;
  }
}

/**
 * Test a specific model with a simple query
 */
async function testModel(apiVersion, modelName) {
  console.log(`\nTesting model: ${modelName} with API version: ${apiVersion}`);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': apiVersion
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'user',
            content: 'Hello, are you working? Reply with a very brief response.'
          }
        ],
        max_tokens: 100
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Model ${modelName} works!`);
      console.log(`Response: ${data.content[0].text.substring(0, 50)}...`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ Error with model ${modelName}: ${response.status} ${response.statusText}`);
      console.error(errorText);
      return false;
    }
  } catch (error) {
    console.error(`❌ Exception when testing model ${modelName}: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('🔍 Claude API Model Tester 🔍');
  console.log('============================');
  
  // First, try to fetch all available models
  for (const apiVersion of apiVersions) {
    await fetchModels(apiVersion);
  }
  
  // Then test specific models
  console.log('\n📝 Testing specific models:');
  console.log('=========================');
  
  for (const apiVersion of apiVersions) {
    for (const model of modelTests) {
      await testModel(apiVersion, model);
    }
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
}); 