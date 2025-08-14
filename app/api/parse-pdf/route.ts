import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "@/lib/supabase/database.types";
import { parsePDF } from "@/lib/pdf-parser";

// Create a Supabase client with the service role key for admin access
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
    // Get the form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    
    console.log("PDF upload request received");
    console.log("File name:", file?.name);
    console.log("File size:", file?.size);
    console.log("Client provided userId:", userId);

    // Validate file
    if (!file) {
      console.error("No file provided in request");
      return NextResponse.json(
        { error: "Missing file", details: "A PDF file is required" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      console.error("Invalid file type:", file.type);
      return NextResponse.json(
        { error: "Invalid file type", details: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      console.error("File too large:", file.size);
      return NextResponse.json(
        { error: "File too large", details: "PDF file must be smaller than 50MB" },
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

    // Parse the PDF
    try {
      const pdfData = await parsePDF(file);
      
      if (!pdfData || !pdfData.content) {
        console.error("Failed to parse PDF content:", file.name);
        return NextResponse.json(
          { error: "PDF parsing failed", details: "Could not extract content from the provided PDF" },
          { status: 422 }
        );
      }

      // Calculate estimated read time (average reading speed: 200 words per minute)
      const wordCount = pdfData.word_count || 0;
      const estimatedReadTime = Math.ceil(wordCount / 200);

      // Use admin client to insert the article (bypassing RLS)
      const { data: article, error } = await supabaseAdmin
        .from("articles")
        .insert({
          user_id: effectiveUserId,
          url: `pdf://${file.name}`, // Use a special URL format for PDFs
          title: pdfData.title || "Untitled PDF",
          author: pdfData.author || null,
          published_date: pdfData.date_published || null,
          content: pdfData.content || "",
          excerpt: pdfData.excerpt || null,
          lead_image_url: pdfData.lead_image_url || null,
          domain: pdfData.domain,
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
            { error: "Duplicate article", details: "You have already saved this PDF" },
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

      console.log("PDF successfully added for user:", effectiveUserId);
      return NextResponse.json({ article });
    } catch (parsingError) {
      console.error("PDF parsing error:", parsingError);
      return NextResponse.json(
        { 
          error: "PDF parsing failed", 
          details: parsingError instanceof Error ? parsingError.message : "Unknown parsing error",
          filename: file.name
        },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in parse-pdf API:", error);
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