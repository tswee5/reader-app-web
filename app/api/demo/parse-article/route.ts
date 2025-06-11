import { NextResponse } from "next/server";
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

// Rate limiting (simple in-memory store - in production you'd want Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(ip);
  
  if (!userRequests) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (now > userRequests.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userRequests.count >= RATE_LIMIT) {
    return false;
  }
  
  userRequests.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        { error: "Rate limit exceeded", details: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { url } = body;

    // Validate URL
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid request", details: "URL is required" },
        { status: 400 }
      );
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL", details: "Please provide a valid URL" },
        { status: 400 }
      );
    }

    console.log("Demo: Parsing article URL:", url);

    // Parse the article using the existing utility
    try {
      const articleData = await parseArticle(url);
      
      if (!articleData || !articleData.content) {
        console.error("Demo: Failed to parse article content:", url);
        return NextResponse.json(
          { error: "Article parsing failed", details: "Could not extract content from the provided URL" },
          { status: 422 }
        );
      }

      // Calculate estimated read time (average reading speed: 200 words per minute)
      const wordCount = articleData.word_count || 0;
      const estimatedReadTime = Math.ceil(wordCount / 200);

      // Return the parsed article data (no database save for demo)
      const guestArticle = {
        id: `demo-${Date.now()}`, // Temporary ID for demo
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
        created_at: new Date().toISOString(),
        user_id: null, // No user for demo
        is_demo: true // Flag to indicate this is a demo article
      };

      console.log("Demo: Article successfully parsed");
      return NextResponse.json({ article: guestArticle });
    } catch (parsingError) {
      console.error("Demo: Article parsing error:", parsingError);
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
    console.error("Demo: Unexpected error in parse-article API:", error);
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