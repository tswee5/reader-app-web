import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

// Admin client to bypass RLS
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function GET(request: Request) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const articleId = searchParams.get('articleId');
    
    if (!userId) {
      return NextResponse.json({
        error: "Missing userId parameter"
      }, { status: 400 });
    }
    
    // Check if the user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      return NextResponse.json({
        error: "Error fetching user",
        details: userError
      }, { status: 500 });
    }
    
    // If articleId is provided, fetch a single article
    if (articleId) {
      const { data: article, error: articleError } = await supabaseAdmin
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .eq('user_id', userId)
        .single();
        
      if (articleError) {
        return NextResponse.json({
          error: "Error fetching article",
          details: articleError
        }, { status: 500 });
      }
      
      return NextResponse.json({
        article
      });
    }
    
    // Otherwise, get all articles for this user
    const { data: articles, error: articlesError } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('user_id', userId);
      
    if (articlesError) {
      return NextResponse.json({
        error: "Error fetching articles",
        details: articlesError
      }, { status: 500 });
    }
    
    // Query for RLS policies directly from pg_policies
    const { data: policies } = await supabaseAdmin.from('articles').select('*').limit(0);
    
    return NextResponse.json({
      user,
      articlesCount: articles?.length || 0,
      articles: articles?.map(article => ({
        id: article.id,
        title: article.title,
        url: article.url,
        created_at: article.created_at
      })),
      tables: {
        articles: !!policies
      }
    });
    
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({
      error: "Unexpected error",
      details: error
    }, { status: 500 });
  }
} 