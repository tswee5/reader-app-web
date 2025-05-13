import { NextResponse } from "next/server";

// Define Claude API URL and key from env variables
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

export async function GET(req: Request) {
  try {
    // Check if API key is configured
    if (!CLAUDE_API_KEY) {
      return NextResponse.json(
        { error: "Claude API key not configured" },
        { status: 500 }
      );
    }
    
    // Simplified API key info
    const apiKeyInfo = {
      exists: !!CLAUDE_API_KEY,
      length: CLAUDE_API_KEY.length,
      prefix: CLAUDE_API_KEY.substring(0, 6) + '...',
      authMethod: 'x-api-key'
    };
    
    // Test fetching models from Claude to verify API key works
    try {
      console.log("Testing Claude API key by fetching models...");
      
      // Always use x-api-key header
      const apiHeaders = {
        'anthropic-version': '2023-06-01',
        'x-api-key': CLAUDE_API_KEY
      };
      
      const response = await fetch('https://api.anthropic.com/v1/models', {
        method: 'GET',
        headers: apiHeaders
      });
      
      // Log detailed response information
      console.log('Claude API response status:', response.status);
      
      // Fixed headers conversion to avoid iterator type error
      const headersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      console.log('Claude API response headers:', headersObj);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Claude API response data structure:', JSON.stringify(data, null, 2).substring(0, 500) + '...');
        
        // Add defensive check for data.data (the API returns models in a data array)
        if (!data) {
          console.error('Empty API response');
          return NextResponse.json({
            success: false,
            apiKeyInfo,
            error: {
              status: 'parsing_error',
              statusText: 'Empty Response',
              details: {
                message: 'The API response was empty'
              }
            }
          });
        }
        
        // Handle new API response format where models are in data array
        const models = data.data || data.models;
        
        if (!models || !Array.isArray(models)) {
          console.error('Unexpected API response format:', data);
          return NextResponse.json({
            success: false,
            apiKeyInfo,
            error: {
              status: 'parsing_error',
              statusText: 'Invalid Response Format',
              details: {
                message: 'The API response did not contain the expected models data',
                rawResponse: JSON.stringify(data).substring(0, 1000)
              }
            }
          });
        }
        
        return NextResponse.json({
          success: true,
          apiKeyInfo,
          models: models.map((model: any) => ({
            id: model.id,
            name: model.display_name || model.name || model.id,
            description: model.description || `${model.display_name || model.id} (created: ${model.created_at || 'unknown'})`
          }))
        });
      } else {
        const errorText = await response.text();
        console.error('Claude API error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { raw_response: errorText };
        }
        
        return NextResponse.json({
          success: false,
          apiKeyInfo,
          error: {
            status: response.status,
            statusText: response.statusText,
            details: errorData
          }
        });
      }
    } catch (apiError) {
      return NextResponse.json({
        success: false,
        apiKeyInfo,
        error: {
          message: apiError instanceof Error ? apiError.message : String(apiError)
        }
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Debug API error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 