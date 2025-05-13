import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CLAUDE_MODELS, getClaudeApiVersion } from '@/lib/ai/claude-models';

// Initialize service role client with admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseService = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Define Claude API URL and key
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

// Add more detailed logging
const logAuthDetails = async (supabaseClient: any) => {
  try {
    const { data } = await supabaseClient.auth.getSession();
    console.log("Current session exists:", !!data.session);
    if (data.session) {
      console.log("Session expires at:", data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : 'N/A');
      console.log("Access token exists:", !!data.session?.access_token);
      console.log("Access token length:", data.session?.access_token?.length || 0);
    }
    return data.session;
  } catch (e) {
    console.error("Error checking session:", e);
    return null;
  }
};

export async function POST(req: Request) {
  try {
    console.log("Summarize API route handler called");
    
    // Get a reference to the request headers for logging
    const headers = new Headers(req.headers);
    const cookieHeader = headers.get('cookie');
    console.log("Cookie header exists:", !!cookieHeader);
    console.log("Cookie header length:", cookieHeader?.length || 0);
    
    // If there's a cookie header, log it for debugging
    if (cookieHeader) {
      const cookieParts = cookieHeader.split(';').map(c => c.trim());
      console.log("Cookies found:", cookieParts.length);
      
      // Look specifically for auth-related cookies
      const authCookies = cookieParts.filter(c => 
        c.startsWith('supabase-auth=') || 
        c.startsWith('sb-') || 
        c.startsWith('sb=')
      );
      
      console.log("Auth cookies found:", authCookies.length);
      authCookies.forEach(c => {
        const [name] = c.split('=');
        console.log(`- ${name}: length=${c.length - name.length - 1}`);
      });
    }
    
    // Initialize the route handler client using our improved helper
    const supabase = createServerSupabaseClient();
    
    // Extract data from request
    const { articleId, content } = await req.json();

    if (!articleId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // First, log the current session state
    console.log("Checking initial session state...");
    
    // ENHANCED AUTH APPROACH: Try multiple auth methods in sequence
    let userId: string | undefined;
    const isTestMode = articleId.startsWith('test-');
    
    // 1. First, try getUser (fastest way if cookies are working)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (!userError && userData?.user) {
      console.log("Authentication successful via getUser");
      userId = userData.user.id;
    } else {
      console.log("getUser failed, trying session");
      
      // 2. If getUser fails, try getting the session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (!sessionError && sessionData?.session?.user) {
        console.log("Authentication successful via getSession");
        userId = sessionData.session.user.id;
      } else {
        console.log("getSession failed, trying refresh");
        
        // 3. If session fails, try refreshing the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (!refreshError && refreshData?.session?.user) {
          console.log("Authentication successful via refreshSession");
          userId = refreshData.session.user.id;
        } else {
          // All authentication methods failed
          console.error("All authentication methods failed:", userError || sessionError || refreshError);
          
          // Allow test mode requests without auth for testing
          if (isTestMode) {
            console.log("TEST MODE: Allowing access to test article without authentication");
            userId = 'test-user-id';
          } else {
            return NextResponse.json(
              { error: "Your session has expired. Please log in again." },
              { status: 401 }
            );
          }
        }
      }
    }
    
    console.log("Summarize - Authenticated user ID:", userId);

    // Skip article verification for test articles
    let articleExists = isTestMode;
    
    if (!articleExists) {
      // Verify article access using the service client with admin rights
      const { data: article, error: articleError } = await supabaseService
        .from('articles')
        .select('id')
        .eq('id', articleId)
        .eq('user_id', userId)
        .single();

      if (articleError || !article) {
        return NextResponse.json(
          { error: "Article not found or access denied" },
          { status: 404 }
        );
      }
      
      articleExists = true;
    }

    // Check if API key is configured
    if (!CLAUDE_API_KEY) {
      console.error("Claude API key not configured");
      return NextResponse.json(
        { error: "Claude AI is not available", details: "API key not configured. Please contact support." },
        { status: 500 }
      );
    }
    
    // For test articles, return a mock response to test auth without calling Claude
    if (isTestMode) {
      return NextResponse.json({ 
        summary: "This is a test summary for authentication debugging purposes. If you see this message, it means authentication is working for the summarize API route.",
        testMode: true
      });
    }

    // Truncate content if it's very long
    const truncatedContent = content.length > 8000 
      ? content.substring(0, 8000) + "..." 
      : content;

    // Prepare the prompt for Claude
    const prompt = `
Please provide a comprehensive yet concise summary of the following article. 
Highlight the main points, key arguments, and significant conclusions.

Article:
"""
${truncatedContent}
"""

Your summary should:
1. Capture the essence of the article in a structured format
2. Be clear and informative
3. Be around 3-5 paragraphs
`;

    // Call Claude API with x-api-key header
    console.log("Calling Claude API...");
    
    // Always use x-api-key header
    const apiHeaders = {
      'Content-Type': 'application/json',
      'anthropic-version': getClaudeApiVersion(),
      'x-api-key': CLAUDE_API_KEY
    };
    
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        model: CLAUDE_MODELS.SONNET,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.5
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { raw_response: errorText };
      }
      
      console.error('Claude API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      
      return NextResponse.json(
        { 
          error: "Failed to generate summary",
          details: `API responded with ${response.status}: ${response.statusText}`
        },
        { status: 500 }
      );
    }

    const claudeResponse = await response.json();
    const summary = claudeResponse.content[0].text;
    
    // Log the summary generation in the database using service client
    await supabaseService
      .from('ai_interactions')
      .insert({
        user_id: userId,
        article_id: articleId,
        user_query: 'Generate summary',
        ai_response: summary,
        created_at: new Date().toISOString()
      });

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarize API error:', error);
    return NextResponse.json(
      { error: "Failed to generate summary", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 