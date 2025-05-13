// /app/api/ai/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/supabase/database.types";
import { CLAUDE_MODELS, getClaudeApiVersion } from "@/lib/ai/claude-models";

const MAX_CONTENT_LENGTH = 50000; // About 12,500 words

export async function POST(req: NextRequest) {
  try {
    // 1. Initialize Supabase with fresh cookies
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // 2. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 3. Parse incoming request body
    const { articleId, articleContent, prompt, conversationId } = await req.json();

    if (!articleId || !prompt) {
      return NextResponse.json({ error: "Article ID and prompt are required." }, { status: 400 });
    }

    // 4. Get article content from DB if not provided
    let content = articleContent;
    if (!content) {
      const { data: article, error: articleError } = await supabase
        .from("articles")
        .select("content, title")
        .eq("id", articleId)
        .eq("user_id", user.id)
        .single();
      if (articleError || !article) {
        return NextResponse.json({ error: "Article not found or access denied." }, { status: 404 });
      }
      content = article.content;
    }

    // 5. Truncate if content too large
    if (content.length > MAX_CONTENT_LENGTH) {
      content = content.substring(0, MAX_CONTENT_LENGTH) + "...";
    }

    // 6. Get or create conversation
    let conversation;
    if (conversationId) {
      const { data: existingConversation, error: convError } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .eq("article_id", articleId)
        .single();
      if (convError || !existingConversation) {
        return NextResponse.json({ error: "Conversation not found or access denied." }, { status: 404 });
      }
      conversation = existingConversation;
    } else {
      const { data: newConversation, error: createError } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          article_id: articleId,
          title: prompt.substring(0, 50) + (prompt.length > 50 ? "..." : "")
        })
        .select()
        .single();
      if (createError || !newConversation) {
        return NextResponse.json({ error: "Failed to create conversation." }, { status: 500 });
      }
      conversation = newConversation;
    }

    // 7. Confirm Anthropic API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic API key not configured." }, { status: 500 });
    }

    // 8. Build user message for Claude
    const userMessage = `
Here is an article:

"""
${content}
"""

${prompt}
    `.trim();

    // 9. Save user message to DB
    const { data: userDbMessage, error: messageError } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversation.id,
        role: "user",
        content: userMessage
      })
      .select()
      .single();
    if (messageError || !userDbMessage) {
      return NextResponse.json({ error: "Failed to save user message." }, { status: 500 });
    }

    // 10. Call Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": getClaudeApiVersion()
      },
      body: JSON.stringify({
        model: CLAUDE_MODELS.OPUS,
        max_tokens: 4000,
        temperature: 0.5,
        messages: [{ role: "user", content: userMessage }]
      })
    });

    if (!claudeResponse.ok) {
      const errorData = await claudeResponse.json();
      console.error("Claude API Error:", errorData);
      return NextResponse.json({ error: "Error calling Claude API", details: errorData }, { status: 500 });
    }

    const claudeData = await claudeResponse.json();
    const aiMessage = claudeData.content[0].text;

    // 11. Save AI message to DB
    const { data: aiDbMessage, error: aiMessageError } = await supabase
      .from("ai_messages")
      .insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: aiMessage
      })
      .select()
      .single();
    if (aiMessageError || !aiDbMessage) {
      return NextResponse.json({ error: "Failed to save AI message." }, { status: 500 });
    }

    // 12. Return the result
    return NextResponse.json({
      message: aiMessage,
      conversation: {
        id: conversation.id,
        title: conversation.title
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Unexpected AI API Error:", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
