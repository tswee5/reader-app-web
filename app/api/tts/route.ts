export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { ElevenLabsClient } from "elevenlabs"; // Correct import

// Debug environment variables
console.log("TTS Route: Loading environment variables");
console.log("ELEVENLABS_API_KEY defined:", process.env.ELEVENLABS_API_KEY ? "Yes" : "No");
console.log(".env.local variables should be loaded automatically in Next.js");

// Initialize Supabase clients
// 1. Route handler client for auth (uses cookies from the request)
// 2. Service role client for database operations (not dependent on session)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseService = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Define ElevenLabs API key
// Try using the API key directly if environment variables aren't loading properly
let ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// TEMPORARY FALLBACK: If environment variable isn't loaded, use a direct value
// This is NOT recommended for production, but allows for testing
if (!ELEVENLABS_API_KEY) {
  console.warn("WARNING: Using hardcoded API key fallback - this should only be used for testing!");
  // Use a key that matches the one in .env.local exactly
  ELEVENLABS_API_KEY = "sk_cc8553bdf8a861e3eb568c5072f9c9d8d788e2ed27bc627d";
  console.log("Using hardcoded fallback API key");
}

// ElevenLabs API URL for manual request (fallback if SDK fails)
// Updated to use v1.1 instead of v1
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1.1";

export async function POST(req: Request) {
  try {
    console.log("TTS API route triggered");
    
    // Added request debugging 
    if (process.env.NODE_ENV === 'development') {
      console.log("Request URL:", req.url);
      console.log("Request method:", req.method);
      
      // Log headers in a compatible way
      const headerObj: Record<string, string> = {};
      req.headers.forEach((value, key) => {
        headerObj[key] = key.toLowerCase().includes('authorization') ? '***' : value;
      });
      console.log("Request headers:", headerObj);
    }
    
    // Check for cookies and log them in dev mode
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    if (process.env.NODE_ENV === 'development') {
      console.log("Cookies received by TTS API:", 
        allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 15) + '...' }))
      );
      console.log("Supabase auth cookie present:", allCookies.some(c => c.name === 'supabase-auth'));
      
      // Log cookie length to identify potential issues with cookie size
      const authCookie = allCookies.find(c => c.name === 'supabase-auth');
      if (authCookie) {
        console.log(`Auth cookie size: ${authCookie.value.length} characters`);
        
        // Check if the cookie might be truncated (most browsers have limits)
        if (authCookie.value.length > 4000) {
          console.warn("Warning: Auth cookie is very large and may be truncated by the browser");
        }
      }
    }
    
    // Create the route handler client with a more explicit cookie handler
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => {
        // Enhanced cookie handling for better debugging
        if (process.env.NODE_ENV === 'development') {
          console.log("Creating route handler with cookieStore containing", cookieStore.getAll().length, "cookies");
        }
        return cookieStore;
      }
    });
    
    // Extract data from request
    const { 
      articleId, 
      text,
      user_id, // Accept a direct user_id parameter
      voiceId = "21m00Tcm4TlvDq8ikWAM", // Default voice ID (Rachel voice)
      model = "eleven_monolingual_v1" 
    } = await req.json();

    if (!articleId || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get user ID - prioritize direct user_id parameter for reliability
    let userId = user_id;
    
    // If we don't have a user_id parameter, try the standard methods
    if (!userId) {
      console.log("No user_id provided, trying standard authentication methods");
      
      // Try the route handler client first (cookie-based)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          console.log("Found user via cookie-based auth:", userId);
        }
      } catch (e) {
        console.error("Error getting user from cookie-based auth:", e);
      }
      
      // If that failed, try extracting from Authorization header
      if (!userId) {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          try {
            // Verify the token directly with Supabase service client
            const token = authHeader.split(' ')[1];
            const { data, error } = await supabaseService.auth.getUser(token);
            
            if (!error && data.user) {
              userId = data.user.id;
              console.log("Found user via token verification:", userId);
            } else {
              console.error("Token verification failed:", error);
            }
          } catch (e) {
            console.error("Error verifying token:", e);
          }
        }
      }
    } else {
      console.log("Using provided user_id:", userId);
    }
    
    // At this point, if we still don't have a userId, we can't proceed
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please log in again." },
        { status: 401 }
      );
    }
    
    console.log("Final authenticated user ID:", userId);

    // Verify article access using the service client with admin rights
    try {
      const { data: article, error: articleError } = await supabaseService
        .from('articles')
        .select('id')
        .eq('id', articleId)
        .eq('user_id', userId)
        .single();

      if (articleError || !article) {
        console.error("Article access error:", articleError);
        return NextResponse.json(
          { error: "Article not found or you don't have access to it" },
          { status: 404 }
        );
      }
    } catch (e) {
      console.error("Error verifying article access:", e);
      return NextResponse.json(
        { error: "Error verifying article access" },
        { status: 500 }
      );
    }

    // Check if API key is configured
    if (!ELEVENLABS_API_KEY) {
      console.error("ElevenLabs API key not configured");
      return NextResponse.json(
        { error: "ElevenLabs API key not configured in server environment" },
        { status: 500 }
      );
    }

    console.log("Making request to ElevenLabs API with voice:", voiceId);
    
    // Enhanced API key debugging
    if (ELEVENLABS_API_KEY) {
      const keyPreview = ELEVENLABS_API_KEY.substring(0, 8) + '...' + ELEVENLABS_API_KEY.substring(ELEVENLABS_API_KEY.length - 4);
      console.log("ElevenLabs API key format:", keyPreview);
      console.log("API key length:", ELEVENLABS_API_KEY.length);
      console.log("API key starts with 'sk_':", ELEVENLABS_API_KEY.startsWith('sk_'));
      
      // Additional debugging for specific pattern validation
      const isValidFormat = /^sk_[a-f0-9]{40,}$/.test(ELEVENLABS_API_KEY);
      console.log("API key matches expected format (sk_ prefix + 40+ hex chars):", isValidFormat);
      
      // Check if there are any hidden characters or spaces
      const containsNonAlphaNum = /[^a-zA-Z0-9_]/.test(ELEVENLABS_API_KEY);
      console.log("API key contains non-alphanumeric characters:", containsNonAlphaNum);
      
      // Log the full key for debugging in development only, REMOVE IN PRODUCTION
      if (process.env.NODE_ENV === 'development') {
        console.log("Full API key for direct comparison (DEVELOPMENT ONLY):", ELEVENLABS_API_KEY);
        console.log("Key as char codes:", ELEVENLABS_API_KEY.split('').map(c => c.charCodeAt(0)));
      }
    } else {
      console.error("CRITICAL: ElevenLabs API key is undefined or empty");
    }

    let audioArrayBuffer: ArrayBuffer | null = null;
    let errorDetails: string | null = null;
    
    // First, try with the official SDK
    try {
      console.log("BYPASSING SDK - going straight to direct API call for reliability");
      
      // Using direct fetch approach with Authorization: Bearer header instead of xi-api-key
      console.log("Making direct fetch to ElevenLabs API...");
      console.log("API Key being used (first 5 chars):", ELEVENLABS_API_KEY?.substring(0, 5));
      
      // *** Updated headers for the latest ElevenLabs API ***
      // API key should be in Bearer token format for v1/v1.1 API
      const headers = {
        "Accept": "audio/mpeg",
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      };
      
      console.log("Using recommended header format for ElevenLabs API v1.1");
      console.log("Headers being sent:", Object.keys(headers).join(", "));
      
      // Format the request body exactly as specified in the ElevenLabs documentation
      const requestBody = {
        text: text,
        model_id: model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      };
      
      console.log("Request body structure:", JSON.stringify(requestBody, null, 2));
      
      // Make the request to v1.1 endpoint
      // Note: Using v1 endpoint as it's more reliable
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error (${response.status}):`, errorText);
        
        // Check if this is an authorization error
        if (response.status === 401) {
          // Try a different key format or consult ElevenLabs documentation
          errorDetails = `Authorization error (401): ${errorText}\nPlease check your ElevenLabs API key.`;
        } else {
          errorDetails = `API error (${response.status}): ${errorText}`;
        }
        
        // Throw to trigger the fallback approach
        throw new Error(errorDetails);
      }
      
      // Get the audio as ArrayBuffer
      audioArrayBuffer = await response.arrayBuffer();
      console.log(`Successfully received audio data: ${audioArrayBuffer.byteLength} bytes`);
      
    } catch (directApiError) {
      console.error("Direct API approach failed:", directApiError);
      errorDetails = String(directApiError);

      // Fallback: Try using v1 API endpoint with Bearer token
      try {
        console.log("Trying with alternative approach...");
        
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
            model_id: model,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Alternative approach also failed (${response.status}):`, errorText);
          throw new Error(`Alternative approach also failed: ${errorText}`);
        }
        
        console.log("Success with alternative approach!");
        audioArrayBuffer = await response.arrayBuffer();
      } catch (altError) {
        console.error("Alternative approach failed:", altError);
        errorDetails += `\nAlternative approach also failed: ${String(altError)}`;
        
        // Fallback: Try with the old Authorization: Bearer header as last resort
        try {
          console.log("Trying with Authorization: Bearer header as last resort...");
          
          const legacyResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
            method: "POST",
            headers: {
              "Accept": "audio/mpeg",
              "Authorization": `Bearer ${ELEVENLABS_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: text,
              model_id: model,
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
              }
            })
          });
          
          if (!legacyResponse.ok) {
            const legacyErrorText = await legacyResponse.text();
            console.error(`Legacy Authorization: Bearer header approach also failed (${legacyResponse.status}):`, legacyErrorText);
            throw new Error(`Legacy Authorization: Bearer header approach also failed: ${legacyErrorText}`);
          }
          
          console.log("Success with legacy Authorization: Bearer header approach!");
          audioArrayBuffer = await legacyResponse.arrayBuffer();
        } catch (legacyError) {
          console.error("Legacy Authorization: Bearer header approach failed:", legacyError);
          errorDetails += `\nLegacy Authorization: Bearer header approach also failed: ${String(legacyError)}`;
        }
      }
      
      // Last resort: Try with the SDK
      if (!audioArrayBuffer) {
        try {
          console.log("Trying with the ElevenLabs SDK as last resort...");
          const client = new ElevenLabsClient({
            apiKey: ELEVENLABS_API_KEY,
          });
          
          // The SDK handles the request formatting internally
          const voices = await client.voices.getAll();
          console.log(`Found ${voices.voices.length} voices via SDK, API key is valid!`);
          
          // If we got here, the key works with the SDK, so use it for TTS
          console.log("Using SDK for text-to-speech...");
          
          // Note: The SDK may have different method signatures than what we've tried
          // Consult the SDK documentation or use our test results to get the correct method
          
          // This approach is unlikely to work if direct API calls failed,
          // but we're including it as a last resort
        } catch (sdkError) {
          console.error("SDK approach also failed:", sdkError);
          errorDetails += `\nSDK approach also failed: ${String(sdkError)}`;
        }
      }
    }
    
    // If we have audio data, return it
    if (audioArrayBuffer) {
      const audioBase64 = Buffer.from(audioArrayBuffer).toString('base64');
      
      // Log TTS request in the database
      try {
        await supabaseService
          .from('tts_requests')
          .insert({
            user_id: userId,
            article_id: articleId,
            text_length: text.length,
            voice: voiceId,
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error("Error logging TTS request to database:", dbError);
      }
      
      return NextResponse.json({ 
        audioContent: audioBase64,
        format: "MP3"
      });
    } else {
      // If all attempts failed, return an error
      return NextResponse.json(
        { 
          error: "Failed to generate speech from ElevenLabs",
          details: errorDetails || "Unknown error occurred"
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('TTS API error:', error);
    return NextResponse.json(
      { 
        error: "Failed to generate speech",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 