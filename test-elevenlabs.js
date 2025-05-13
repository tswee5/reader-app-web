// Simple test file to check ElevenLabs SDK usage
const elevenlabs = require('elevenlabs');

console.log('Available exports from elevenlabs package:');
console.log(Object.keys(elevenlabs));

// Try accessing the API
console.log('API object structure:');
console.log(elevenlabs.api ? 'api exists' : 'api not found');

// Check if it has a voices method
console.log('Voices API:');
console.log(elevenlabs.api && elevenlabs.api.voices ? 'voices exists' : 'voices not found');

// Check available methods
if (elevenlabs.api && elevenlabs.api.voices) {
  console.log('Available methods on voices API:');
  console.log(Object.keys(elevenlabs.api.voices));
}

// Check generate method
console.log('TTS Generate method:');
console.log(elevenlabs.generate ? 'generate exists' : 'generate not found');

// Check if there's a client or instance creator
console.log('Client creation:');
console.log(elevenlabs.Client ? 'Client exists' : 'Client not found'); 