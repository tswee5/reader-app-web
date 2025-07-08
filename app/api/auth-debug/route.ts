export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Database } from "@/lib/supabase/database.types";

export async function GET() {
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get session and cookie details
    const sessionResponse = await supabase.auth.getSession();
    const allCookies = cookies().getAll();
    const cookieNames = allCookies.map(cookie => cookie.name);
    
    // Attempt to get user data
    let userData = null;
    if (sessionResponse.data.session) {
      // Try to access the users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionResponse.data.session.user.id)
        .single();
      
      if (userRecord) {
        userData = userRecord;
      }
      
      // Try to insert a test record to check RLS
      const testId = Date.now().toString();
      const { error: insertError } = await supabase
        .from('articles')
        .insert({
          user_id: sessionResponse.data.session.user.id,
          url: `https://test.com/${testId}`,
          title: "Test Article",
          content: "Test content"
        });
        
      return NextResponse.json({
        status: "success",
        auth: {
          session: sessionResponse.data.session ? {
            userId: sessionResponse.data.session.user.id,
            email: sessionResponse.data.session.user.email,
            isAuthenticated: true
          } : null,
          sessionError: sessionResponse.error,
        },
        cookies: {
          count: allCookies.length,
          names: cookieNames
        },
        userData,
        testInsert: {
          success: !insertError,
          error: insertError
        }
      }, { status: 200 });
    } else {
      return NextResponse.json({
        status: "error",
        message: "No session found",
        sessionData: sessionResponse,
        cookies: {
          count: allCookies.length,
          names: cookieNames
        }
      }, { status: 401 });
    }
  } catch (error) {
    console.error("Authentication debug error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to check authentication",
      error: error
    }, { status: 500 });
  }
} 