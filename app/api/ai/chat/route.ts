import { NextResponse } from "next/server"
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AIChatService, ChatRequest } from '@/lib/ai/chat-service'

export async function POST(req: Request) {
  try {
    // Parse request body
    const requestData = await req.json();
    const { 
      currentMessage, 
      conversationHistory = [], 
      article, 
      articleId,
      conversationId,
      articleUrl 
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

    // Initialize the route handler client
    const supabase = createServerSupabaseClient();
    
    // Fetch user ID from session
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
    
    // Verify article access (but use URL from request body)
    const { data: articleData, error: articleError } = await supabase
      .from('articles')
      .select('id')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    if (articleError || !articleData) {
      return NextResponse.json(
        { error: "Article not found or access denied" },
        { status: 404 }
      )
    }

    // Prepare chat request
    const chatRequest: ChatRequest = {
      conversationId,
      message: currentMessage,
      articleId,
      articleContent,
      articleUrl: articleUrl,
      userId: user.id
    };

    // Process message using enhanced AI chat service
    const chatResponse = await AIChatService.processMessage(chatRequest);

    // Log conversation to database for analytics
    try {
      await supabase
        .from('ai_interactions')
        .insert({
          user_id: user.id,
          article_id: articleId,
          user_query: currentMessage,
          ai_response: chatResponse.response,
          created_at: new Date().toISOString()
        })
    } catch (logError) {
      // Just log the error but don't fail the request
      console.error('Error logging conversation:', logError)
    }

    return NextResponse.json({
      response: chatResponse.response,
      conversationId: chatResponse.conversationId,
      conversationState: chatResponse.conversationState,
      webSnippets: chatResponse.webSnippets,
      tokenUsage: chatResponse.tokenUsage,
      isFirstMessage: chatResponse.isFirstMessage
    })
  } catch (error) {
    console.error("Unhandled error in enhanced chat API route:", error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key not configured')) {
        return NextResponse.json(
          { 
            error: "AI service configuration error", 
            details: "Claude API key not configured. Please set CLAUDE_API_KEY or ANTHROPIC_API_KEY in your environment variables." 
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('Claude API error')) {
        return NextResponse.json(
          { 
            error: "AI service error", 
            details: error.message 
          },
          { status: 502 }
        );
      }
      
      if (error.message.includes('Conversation not found')) {
        return NextResponse.json(
          { error: "Conversation not found or access denied" },
          { status: 404 }
        );
      }
    }
    
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