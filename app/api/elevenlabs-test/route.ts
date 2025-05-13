import { NextResponse } from "next/server";
import { ElevenLabsClient } from "elevenlabs";

interface TestResult {
  method: string;
  keyFormat: string;
  status?: number;
  success: boolean;
  error?: string;
  data?: {
    voiceCount?: number;
    voiceIds?: string[];
    responseType?: string;
  };
}

export async function GET(req: Request) {
  try {
    // Hard-coded API key for testing purposes 
    // (in production, this would come from environment variables)
    const ELEVENLABS_API_KEY_ORIGINAL = "sk_cc8553bdf8a861e3eb568c5072f9c9d8d788e2ed27bc627d";
    
    // Try different formats to see which one works
    const API_KEYS_TO_TRY = [
      ELEVENLABS_API_KEY_ORIGINAL,  // Original format from the screenshot
      ELEVENLABS_API_KEY_ORIGINAL.replace("sk_", ""), // Without the sk_ prefix
    ];
    
    // Updated to use v1.1 API
    const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1.1";
    
    const results: TestResult[] = [];
    
    // Try each API key format with the official SDK first
    for (const apiKey of API_KEYS_TO_TRY) {
      console.log(`ELEVENLABS TEST: Trying API key format with SDK: ${apiKey.substring(0, 5)}...`);
      
      try {
        // Use the SDK with the current API key
        const client = new ElevenLabsClient({
          apiKey: apiKey,
        });
        
        // Test getting voices list
        const voices = await client.voices.getAll();
        
        const result: TestResult = {
          method: "SDK",
          keyFormat: apiKey.substring(0, 5) + "...",
          success: true,
          data: {
            voiceCount: voices.voices?.length || 0,
            voiceIds: voices.voices?.map(voice => voice.voice_id).slice(0, 3) || []
          }
        };
        
        results.push(result);
      } catch (apiError) {
        // Handle API errors
        results.push({
          method: "SDK",
          keyFormat: apiKey.substring(0, 5) + "...",
          error: String(apiError),
          success: false
        });
      }
    }
    
    // Now try with direct fetch approach
    for (const apiKey of API_KEYS_TO_TRY) {
      console.log(`ELEVENLABS TEST: Trying API key format with direct fetch: ${apiKey.substring(0, 5)}...`);
      
      try {
        // Test getting voices list using fetch
        const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          }
        });
        
        const result: TestResult = {
          method: "Direct fetch",
          keyFormat: apiKey.substring(0, 5) + "...",
          status: response.status,
          success: response.ok
        };
        
        if (response.ok) {
          const voicesData = await response.json();
          result.data = {
            voiceCount: voicesData.voices?.length || 0,
            responseType: "JSON with voices"
          };
        } else {
          const errorText = await response.text();
          result.error = errorText;
        }
        
        results.push(result);
      } catch (fetchError) {
        results.push({
          method: "Direct fetch",
          keyFormat: apiKey.substring(0, 5) + "...",
          error: String(fetchError),
          success: false
        });
      }
    }
    
    // Also try a simple TTS request with direct fetch
    if (results.some(r => r.success)) {
      // Use the key that worked in previous tests
      const workingKey = results.find(r => r.success)?.keyFormat.substring(0, 5) + "...";
      console.log(`Found working key format: ${workingKey}, testing TTS...`);
      
      // Get the full key that worked
      const apiKey = results.find(r => r.success)?.keyFormat.startsWith("sk_41") 
        ? ELEVENLABS_API_KEY_ORIGINAL 
        : ELEVENLABS_API_KEY_ORIGINAL.replace("sk_", "");
      
      try {
        // Test a text-to-speech request
        const ttsResponse = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/21m00Tcm4TlvDq8ikWAM`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "Accept": "audio/mpeg"
          },
          body: JSON.stringify({
            text: "This is a test of the ElevenLabs API.",
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });
        
        results.push({
          method: "TTS request",
          keyFormat: apiKey.substring(0, 5) + "...",
          status: ttsResponse.status,
          success: ttsResponse.ok,
          data: {
            responseType: ttsResponse.ok ? "Audio data" : "Error"
          },
          error: !ttsResponse.ok ? await ttsResponse.text() : undefined
        });
      } catch (ttsError) {
        results.push({
          method: "TTS request",
          keyFormat: apiKey.substring(0, 5) + "...",
          error: String(ttsError),
          success: false
        });
      }
    }
    
    return NextResponse.json({
      message: "ElevenLabs API test results using multiple methods",
      results,
      recommendations: results.some(r => r.success) 
        ? "A working API key format was found! Use this format in your application." 
        : "No working API key format was found. Please check your ElevenLabs account for a valid API key."
    });
    
  } catch (error) {
    console.error("ElevenLabs API test endpoint error:", error);
    return NextResponse.json({
      success: false,
      error: "Exception during ElevenLabs API test",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 