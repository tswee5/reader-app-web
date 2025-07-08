export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/supabase/database.types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get("articleId");

    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    // Get the user from supabase auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", details: authError?.message },
        { status: 401 }
      );
    }

    // Check article existence and ownership
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id")
      .eq("id", articleId)
      .eq("user_id", user.id)
      .single();
    if (articleError || !article) {
      return NextResponse.json(
        { error: "Article not found or access denied", details: articleError?.message },
        { status: 404 }
      );
    }

    // Get all conversations for this article
    const { data: conversations, error: conversationsError } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("article_id", articleId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (conversationsError) {
      console.error("Failed to fetch conversations:", conversationsError);
      return NextResponse.json(
        { error: "Failed to fetch conversations", details: conversationsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("AI Conversations API error (GET):", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get the request body
    const body = await req.json();
    const { articleId, title } = body;

    // Check if required fields are provided
    if (!articleId) {
      return NextResponse.json(
        { error: "Article ID is required" },
        { status: 400 }
      );
    }

    // Get the user from supabase auth
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required", details: authError?.message },
        { status: 401 }
      );
    }

    // Check article existence and ownership before inserting
    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id")
      .eq("id", articleId)
      .eq("user_id", user.id)
      .single();
    if (articleError || !article) {
      return NextResponse.json(
        { error: "Article not found or access denied", details: articleError?.message },
        { status: 404 }
      );
    }

    // Create a new conversation
    const { data: conversation, error: createError } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: user.id,
        article_id: articleId,
        title: title || "New conversation"
      })
      .select()
      .single();

    if (createError || !conversation) {
      console.error("Failed to create conversation:", createError);
      return NextResponse.json(
        { error: "Failed to create conversation", details: createError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error("AI Conversations API error (POST):", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 