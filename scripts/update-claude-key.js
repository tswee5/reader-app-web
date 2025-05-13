#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_FILE = path.join(process.cwd(), '.env.local');

// Function to validate an Anthropic API key
function isValidAnthropicApiKey(key) {
  // Any alphanumeric key of sufficient length is considered valid
  return /^[a-zA-Z0-9]{20,}$/.test(key);
}

// Function to read the current .env.local file
function readEnvFile() {
  try {
    return fs.readFileSync(ENV_FILE, 'utf8');
  } catch (error) {
    // If the file doesn't exist, return empty string
    if (error.code === 'ENOENT') {
      return '';
    }
    throw error;
  }
}

// Function to update the API key in the .env file
function updateApiKey(envContent, key) {
  // If CLAUDE_API_KEY exists, replace it
  if (envContent.includes('CLAUDE_API_KEY=')) {
    return envContent.replace(/CLAUDE_API_KEY=.*$/m, `CLAUDE_API_KEY=${key}`);
  } 
  // If ANTHROPIC_API_KEY exists, replace it
  else if (envContent.includes('ANTHROPIC_API_KEY=')) {
    return envContent.replace(/ANTHROPIC_API_KEY=.*$/m, `ANTHROPIC_API_KEY=${key}`);
  } 
  // Otherwise add CLAUDE_API_KEY
  else {
    return envContent + (envContent.endsWith('\n') ? '' : '\n') + `CLAUDE_API_KEY=${key}\n`;
  }
}

// Main function
async function main() {
  console.log('🤖 Claude API Key Configuration Tool');
  console.log('-----------------------------------');
  console.log('This tool will update your Claude API key in the .env.local file.');
  console.log('You can find your API key at https://console.anthropic.com/keys\n');
  
  rl.question('Enter your Claude API key: ', (key) => {
    // Trim whitespace (common when copying from web)
    key = key.trim();
    
    if (!isValidAnthropicApiKey(key)) {
      console.log('\n❌ Error: This doesn\'t look like a valid Claude API key.');
      console.log('   API keys are typically long alphanumeric strings.\n');
      rl.close();
      return;
    }
    
    try {
      const envContent = readEnvFile();
      const updatedContent = updateApiKey(envContent, key);
      
      // Write the updated content back to the .env.local file
      fs.writeFileSync(ENV_FILE, updatedContent);
      
      console.log('\n✅ Success! Your Claude API key has been updated in .env.local');
      console.log('   Restart your Next.js development server for changes to take effect.\n');
      
    } catch (error) {
      console.error('\n❌ Error updating API key:', error.message);
    }
    
    rl.close();
  });
}

main(); 