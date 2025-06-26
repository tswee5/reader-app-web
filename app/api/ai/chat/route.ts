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
    // Check if API key is configured
    if (!CLAUDE_API_KEY) {
      console.error("Claude API key is not set. Check environment variables ANTHROPIC_API_KEY or CLAUDE_API_KEY");
      return NextResponse.json(
        { 
          error: "AI service configuration error", 
          details: "API key not configured. Contact the site administrator." 
        },
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
    
    // User is authenticated, proceed with fetching the article and URL
    const { data: articleData, error: articleError } = await supabaseService
      .from('articles')
      .select('id, content, url')
      .eq('id', articleId)
      .eq('user_id', user.id)
      .single()

    if (articleError || !articleData) {
      return NextResponse.json(
        { error: "Article not found or access denied" },
        { status: 404 }
      )
    }

    // Get article URL for hybrid approach
    const articleUrl = articleData.url;

    // Fetch the conversation if conversationId is provided
    let conversation = null;
    if (requestData.conversationId) {
      const { data: existingConversation, error: convError } = await supabaseService
        .from('ai_conversations')
        .select('*')
        .eq('id', requestData.conversationId)
        .eq('user_id', user.id)
        .single();
      if (convError || !existingConversation) {
        return NextResponse.json({ error: "Conversation not found or access denied" }, { status: 404 });
      }
      conversation = existingConversation;
    }

    // If this is a new conversation, create it with initial context
    if (!conversation) {
      const { data: newConversation, error: createError } = await supabaseService
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          article_id: articleId,
          title: currentMessage.substring(0, 50) + (currentMessage.length > 50 ? "..." : ""),
          context: null // Will be populated after first AI response
        })
        .select()
        .single();
      if (createError || !newConversation) {
        return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
      }
      conversation = newConversation;
    }

    // For subsequent messages, use the cached context
    const cachedContext = conversation.context;

    // Prepare the conversation history with careful validation
    // Limit to last 10 messages to reduce token usage
    const userMessages = [];
    
    // Process existing conversation history (limit to last 10 messages)
    const historyToProcess = Array.isArray(requestData.conversation) ? 
      requestData.conversation : conversationHistory;
    
    if (Array.isArray(historyToProcess)) {
      // Take only the last 10 messages to reduce token usage
      const limitedHistory = historyToProcess.slice(-10);
      
      for (const msg of limitedHistory) {
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

    // Log token usage estimation (rough calculation)
    const estimatedTokens = JSON.stringify(userMessages).length / 4 + (cachedContext ? cachedContext.length / 4 : 0);
    console.log(`Estimated token usage: ${Math.round(estimatedTokens)} tokens`);

    // Call Claude API with optimized approach
    console.log('Sending request to Claude API with optimized approach');
    
    let response;
    let data;
    let shouldStoreSummary = false;
    
    // Determine if this is the first message in the conversation
    const isFirstMessage = conversationHistory.length === 0;
    
    if (isFirstMessage && articleUrl) {
      // First message: Use web search tool to access the article URL
      console.log('Using web search tool to access:', articleUrl);
      
      response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': getClaudeApiVersion()
        },
        body: JSON.stringify({
          model: CLAUDE_MODELS.SONNET_4,
          system: `You are a knowledgeable and helpful AI assistant. You have access to web search capabilities and can access current information from the internet.

          The user is asking about content available at: ${articleUrl}
          
          Please use the web search tool to access and analyze this content, then provide a comprehensive and accurate response to the user's question. You can also draw upon your training data and web search to provide additional context, background information, or related insights that might be helpful.
          
          After analyzing the content, provide a brief summary (2-3 sentences) of the key points that would be useful for follow-up questions.
          
          Be thorough, accurate, and helpful in your response.`,
          messages: [
            ...userMessages,
            {
              role: "user",
              content: `Please analyze this content and answer the user's question: ${articleUrl}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.5,
          tools: [{
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 3
          }]
        }),
      });
      
      shouldStoreSummary = true;
      
      if (response.ok) {
        data = await response.json();
        const answer = data.content
          .filter((item: any) => item.type === 'text')
          .map((item: any) => item.text)
          .join('');
        
        // Check if web search failed or couldn't access the URL
        if (answer.toLowerCase().includes("cannot access") || 
            answer.toLowerCase().includes("cannot browse") ||
            answer.toLowerCase().includes("cannot visit") ||
            answer.toLowerCase().includes("cannot retrieve") ||
            answer.toLowerCase().includes("not found") ||
            answer.toLowerCase().includes("error")) {
          
          console.log('Web search could not access URL, falling back to content-based approach');
          
          // Fallback to content-based approach
          const fallbackSystemPrompt = `You are a knowledgeable and helpful AI assistant. You have access to web search capabilities and can access current information from the internet.

          Below is content that the user is asking about:
          ${articleContent}
          
          Please analyze this content and answer the user's question. You can also use web search to find additional relevant information, background context, or related insights that would enhance your response.
          
          After analyzing the content, provide a brief summary (2-3 sentences) of the key points that would be useful for follow-up questions.
          
          Be thorough, accurate, and helpful in your response.`;
          
          response = await fetch(CLAUDE_API_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': CLAUDE_API_KEY,
              'anthropic-version': getClaudeApiVersion()
            },
            body: JSON.stringify({
              model: CLAUDE_MODELS.SONNET_4,
              system: fallbackSystemPrompt,
              messages: userMessages,
              max_tokens: 1000,
              temperature: 0.5,
              tools: [{
                type: "web_search_20250305",
                name: "web_search",
                max_uses: 2
              }]
            }),
          });
          
          if (response.ok) {
            data = await response.json();
          }
        }
      }
    } else {
      // Follow-up messages: Use cached context (summary/analysis) but allow web search when needed
      console.log('Using cached context for follow-up message');
      
      const systemPrompt = cachedContext 
        ? `You are a knowledgeable and helpful AI assistant. You have access to web search capabilities and can access current information from the internet.

           Below is context from a previous analysis of content the user is discussing:
           ${cachedContext}
           
           Answer the user's question based on this context and the conversation history. If the user asks for additional information, clarification, or related topics that aren't covered in the cached context, feel free to use web search to provide the most current and accurate information.
           
           Be thorough, accurate, and helpful in your response.`
        : `You are a knowledgeable and helpful AI assistant. You have access to web search capabilities and can access current information from the internet.

           Answer the user's question based on the conversation history. If you need additional information or context to provide a comprehensive answer, feel free to use web search to find relevant and current information.
           
           Be thorough, accurate, and helpful in your response.`;
      
      response = await fetch(CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': getClaudeApiVersion()
        },
        body: JSON.stringify({
          model: CLAUDE_MODELS.SONNET_4,
          system: systemPrompt,
          messages: userMessages,
          max_tokens: 1000,
          temperature: 0.5,
          tools: [{
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 2
          }]
        }),
      });
      
      if (response.ok) {
        data = await response.json();
      }
    }

    // Handle API errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error (${response.status}):`, errorText);
      
      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch (e) {
        errorDetails = { message: errorText };
      }
      
      // Handle rate limit errors specifically
      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: "Rate limit exceeded", 
            details: "You've exceeded the API rate limit. Please wait a moment and try again.",
            retryAfter: response.headers.get('retry-after')
          },
          { status: 429 }
        );
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

    // Store the AI's response as context for follow-up messages if this is the first message
    if (shouldStoreSummary && conversation) {
      try {
        await supabaseService
          .from('ai_conversations')
          .update({ 
            context: answer,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversation.id);
        
        console.log('Stored AI response as context for future messages');
      } catch (updateError) {
        console.error('Error updating conversation context:', updateError);
        // Continue with the response even if updating context fails
      }
    }

    // Save the message to the database if a conversation ID was provided
    const conversationId = requestData.conversationId;
    if (conversationId) {
      try {
        // Save the user message first
        await supabaseService
          .from('ai_messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: userMessage,
            created_at: new Date().toISOString()
          });
          
        // Then save the AI response
        await supabaseService
          .from('ai_messages')
          .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: answer,
            created_at: new Date().toISOString()
          });
      } catch (dbError) {
        console.error('Error saving messages to database:', dbError);
        // Continue with the response even if saving to DB fails
      }
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
      response: answer,
      conversationId: conversation.id
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