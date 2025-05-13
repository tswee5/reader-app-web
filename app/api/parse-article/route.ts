import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "@/lib/supabase/database.types";
import { parseArticle } from "@/lib/article-parser";

// Validate URL format
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Create a Supabase client with the service role key for admin access
// This bypasses RLS policies
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function POST(request: Request) {
  try {
    // Get the URL and userId from the request body
    const requestBody = await request.json().catch(error => {
      console.error("Error parsing request JSON:", error);
      throw new Error("Invalid request format: " + error.message);
    });
    
    const { url, userId } = requestBody;
    
    console.log("Request received with URL:", url);
    console.log("Client provided userId:", userId);

    // Validate URL
    if (!url) {
      console.error("No URL provided in request");
      return NextResponse.json(
        { error: "Missing URL parameter", details: "A valid URL is required" },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      console.error("Invalid URL format:", url);
      return NextResponse.json(
        { error: "Invalid URL format", details: "The provided string is not a valid URL" },
        { status: 400 }
      );
    }

    // Try to get authenticated user from cookies
    const supabase = createRouteHandlerClient<Database>({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("Server session:", session ? `Found for ${session.user.id}` : "Not found");
    if (sessionError) {
      console.error("Session error:", sessionError);
    }

    // Determine user ID to use
    let effectiveUserId = session?.user.id;

    // If no session, fall back to the provided userId
    if (!effectiveUserId && userId) {
      // Verify that the user exists
      const { data: userExists, error: userError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
        
      console.log("User lookup result:", userExists ? "Found" : "Not found");
      if (userError) {
        console.error("User lookup error:", userError);
      }

      if (userExists) {
        effectiveUserId = userId;
        console.log("Using client-provided userId:", effectiveUserId);
      }
    }

    // If we still don't have a user ID, return an error
    if (!effectiveUserId) {
      console.error("No valid user ID found");
      return NextResponse.json(
        { error: "Authentication required", details: "No valid session or user ID provided" },
        { status: 401 }
      );
    }

    // Parse the article
    try {
      const articleData = await parseArticle(url);
      
      if (!articleData || !articleData.content) {
        console.error("Failed to parse article content:", url);
        return NextResponse.json(
          { error: "Article parsing failed", details: "Could not extract content from the provided URL" },
          { status: 422 }
        );
      }

      // Calculate estimated read time (average reading speed: 200 words per minute)
      const wordCount = articleData.word_count || 0;
      const estimatedReadTime = Math.ceil(wordCount / 200);

      // Use admin client to insert the article (bypassing RLS)
      const { data: article, error } = await supabaseAdmin
        .from("articles")
        .insert({
          user_id: effectiveUserId,
          url: url,
          title: articleData.title || "Untitled Article",
          author: articleData.author || null,
          published_date: articleData.date_published || null,
          content: articleData.content || "",
          excerpt: articleData.excerpt || null,
          lead_image_url: articleData.lead_image_url || null,
          domain: articleData.domain,
          word_count: wordCount,
          estimated_read_time: estimatedReadTime,
          reading_progress: 0,
          is_completed: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Database error:", error);
        
        // Check if it's a duplicate article
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "Duplicate article", details: "You have already saved this article" },
            { status: 409 }
          );
        }
        
        // Handle different types of database errors
        if (error.code === "23502") {
          return NextResponse.json(
            { error: "Missing required fields", details: error.message, code: error.code },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: "Database error", details: error.message, code: error.code },
          { status: 500 }
        );
      }

      console.log("Article successfully added for user:", effectiveUserId);
      return NextResponse.json({ article });
    } catch (parsingError) {
      console.error("Article parsing error:", parsingError);
      return NextResponse.json(
        { 
          error: "Article parsing failed", 
          details: parsingError instanceof Error ? parsingError.message : "Unknown parsing error",
          url: url
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in parse-article API:", error);
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