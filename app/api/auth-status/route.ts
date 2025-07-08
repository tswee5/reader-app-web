export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(req: Request) {
  try {
    console.log("Auth Status API route triggered");

    // Debug headers
    const headerObj: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headerObj[key] = key.toLowerCase().includes('authorization') ? '***' : value;
    });
    console.log("Request headers:", headerObj);
    
    // Check cookies
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    console.log("Cookies received by Auth Status API:", 
      allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' }))
    );
    
    // Create the route handler client using our improved helper
    const supabase = createServerSupabaseClient();
    
    // Try to get the session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return NextResponse.json({ 
        status: "error", 
        message: "Session error",
        error: sessionError.message
      }, { status: 500 });
    }

    if (!session) {
      console.log("No session found");
      return NextResponse.json({ 
        status: "unauthorized", 
        message: "No active session",
        authenticated: false,
        cookieCount: allCookies.length
      }, { status: 401 });
    }

    // Session exists
    console.log("Session found for user:", session.user.id);
    
    // Calculate expiry info
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null;
    const isExpired = expiresAt ? new Date() > expiresAt : true;
    const expiresIn = expiresAt ? Math.round((expiresAt.getTime() - Date.now()) / 1000 / 60) : 0;
    
    return NextResponse.json({
      status: "success",
      message: "Authenticated",
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email
      },
      session: {
        expiresAt: expiresAt?.toISOString(),
        isExpired,
        expiresIn: expiresIn > 0 ? `${expiresIn} minutes` : "Expired"
      }
    });
  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to check authentication",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 