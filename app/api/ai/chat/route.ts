import { NextResponse } from "next/server"
import { cookies } from 'next/headers'
import { Database } from '@/lib/supabase/database.types'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CLAUDE_MODELS, getClaudeApiVersion } from '@/lib/ai/claude-models'

// Initialize service role client with admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseService = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Claude API endpoint and key
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY

export async function POST(req: Request) {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      console.error("CLAUDE_API_KEY is not set");
      return NextResponse.json(
        { error: "AI service configuration error", details: "API key not configured" },
        { status: 500 }
      );
    }

    // Read request body only once and store it
    const requestData = await req.json();
    const { 
      currentMessage, 
      conversationHistory = [], 
      article, 
      articleId 
    } = requestData;
    
    // Determine article content, handling both new and legacy formats
    const articleContent = article?.content || requestData.content;
    
    // Validate request parameters
    if (!currentMessage || typeof currentMessage !== 'string' || currentMessage.trim() === '') {
      console.error("Invalid currentMessage:", currentMessage);
      return NextResponse.json(
        { error: "Invalid request", details: "Current message must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!Array.isArray(conversationHistory)) {
      console.error("Invalid conversationHistory:", conversationHistory);
      return NextResponse.json(
        { error: "Invalid request", details: "Conversation history must be an array" },
        { status: 400 }
      );
    }

    if (!articleId || !articleContent) {
      console.error("Missing article information:", { articleId, articleContent });
      return NextResponse.json(
        { error: "Missing required fields", details: "Article ID and content are required" },
        { status: 400 }
      );
    }

    // Initialize the route handler client with improved cookie handling
    const supabase = createServerSupabaseClient();
    
    // Fetch user ID from session with improved error handling
    let { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error("Authentication error:", userError || "No user found")
      
      // Try to get session as fallback
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error("Session error:", sessionError || "No session found")
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }
      
      user = session.user;
    }
    
    // User is authenticated, proceed with fetching the article
    const { data: articleData, error: articleError } = await supabaseService
      .from('articles')
      .select('id, content')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    if (articleError || !articleData) {
      return NextResponse.json(
        { error: "Article not found or access denied" },
        { status: 404 }
      )
    }

    // Prepare system prompt for Claude API
    const systemPrompt = `You are a helpful assistant that answers questions about articles. 
    Below is the content of an article that the user is currently reading. 
    Answer questions based on this content and any other relevant information from the web and your training data.
    Be sure to reference the article content when providing answers. Be concise and accurate.
    
    Article content:
    ${articleContent}
    `

    // Prepare the conversation history with careful validation
    // Ensure all messages have valid content and role fields
    const userMessages = [];
    
    // Process existing conversation history
    const historyToProcess = Array.isArray(requestData.conversation) ? 
      requestData.conversation : conversationHistory;
    
    if (Array.isArray(historyToProcess)) {
      for (const msg of historyToProcess) {
        // Skip any invalid messages or those with missing content
        if (!msg || typeof msg !== 'object' || !msg.role || !msg.content) {
          console.log('Skipping invalid message in conversation:', msg);
          continue;
        }
        
        // Ensure content is a string and never empty
        if (typeof msg.content !== 'string' || msg.content.trim() === '') {
          console.log('Skipping message with invalid content:', msg);
          continue;
        }
        
        // Only include user and assistant messages (system messages handled separately)
        if (msg.role === 'user' || msg.role === 'assistant') {
          userMessages.push({
            role: msg.role,
            content: msg.content.trim()  // Ensure content is trimmed
          });
        }
      }
    }
    
    // Add the current user message, supporting both new and legacy formats
    const userMessage = currentMessage || requestData.message;
    
    if (userMessage && typeof userMessage === 'string') {
      userMessages.push({
        role: "user",
        content: userMessage.trim()
      });
    } else {
      return NextResponse.json(
        { error: "Invalid message format" },
        { status: 400 }
      )
    }
    
    // If there are no valid messages at this point, return an error
    if (userMessages.length === 0) {
      return NextResponse.json(
        { error: "No valid messages provided" },
        { status: 400 }
      )
    }

    // Call Claude API
    console.log('Sending request to Claude API with messages:', JSON.stringify(userMessages));

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': getClaudeApiVersion()
      },
      body: JSON.stringify({
        model: CLAUDE_MODELS.SONNET,
        system: systemPrompt,
        messages: userMessages,
        max_tokens: 1000,
        temperature: 0.5
      }),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error (${response.status}):`, errorText);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch (e) {
        errorDetails = { message: errorText };
      }
      
      return NextResponse.json(
        { 
          error: "AI service error", 
          details: `Status ${response.status}: ${errorDetails.error?.message || errorText}`,
          raw: errorDetails
        },
        { status: 502 }
      );
    }

    const data = await response.json()
    console.log("Claude API response:", JSON.stringify(data, null, 2));
    
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      console.error("Invalid response format from Claude API:", data);
      return NextResponse.json(
        { error: "Invalid API response", details: "Response is missing expected content" },
        { status: 502 }
      );
    }

    // Extract the text from the response
    const answer = data.content
      .filter((item: any) => item.type === 'text')
      .map((item: any) => item.text)
      .join('');

    if (!answer) {
      console.error("No text content in Claude API response:", data);
      return NextResponse.json(
        { error: "Invalid API response", details: "Response contained no text content" },
        { status: 502 }
      );
    }

    // Log conversation to database
    try {
      await supabaseService
        .from('ai_interactions')
        .insert({
          user_id: user.id,
          article_id: articleId,
          user_query: userMessage,
          ai_response: answer,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      // Just log the error but don't fail the request
      console.error('Error logging conversation:', logError)
    }

    return NextResponse.json({
      answer: answer
    })
  } catch (error) {
    console.error("Unhandled error in chat API route:", error);
    return NextResponse.json(
      { 
        error: "Server error", 
        details: error instanceof Error ? error.message : "Unknown error occurred",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
} 