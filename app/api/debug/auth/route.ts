export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';

export async function GET(req: Request) {
  // Get details about cookies and headers
  const headers = new Headers(req.headers);
  const cookieHeader = headers.get('cookie');
  
  // Format cookie info for better readability
  let cookieInfo: any = 'No cookies found';
  if (cookieHeader) {
    const cookiePairs = cookieHeader.split(';').map(c => c.trim());
    cookieInfo = cookiePairs.map(cookie => {
      const [name] = cookie.split('=');
      const value = cookie.substring(name.length + 1);
      return {
        name,
        length: value.length,
        preview: value.substring(0, 30) + (value.length > 30 ? '...' : '')
      };
    });
  }
  
  try {
    // Initialize the route handler client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get session and user data
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    // Try to refresh session and see if that helps
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    // Compile all the debug info
    const debugInfo = {
      request: {
        url: req.url,
        method: req.method,
        headers: Object.fromEntries(headers.entries()),
        cookieHeader: cookieHeader ? `${cookieHeader.length} characters` : 'No cookie header',
        cookies: cookieInfo
      },
      auth: {
        sessionBefore: {
          exists: !!sessionData?.session,
          error: sessionError,
          expiresAt: sessionData?.session?.expires_at 
            ? new Date(sessionData.session.expires_at * 1000).toISOString()
            : null,
          accessTokenLength: sessionData?.session?.access_token?.length || 0,
          refreshTokenLength: sessionData?.session?.refresh_token?.length || 0
        },
        user: {
          exists: !!userData?.user,
          error: userError,
          id: userData?.user?.id,
          email: userData?.user?.email
        },
        sessionRefresh: {
          success: !!refreshData?.session,
          error: refreshError,
          expiresAt: refreshData?.session?.expires_at 
            ? new Date(refreshData.session.expires_at * 1000).toISOString()
            : null
        }
      }
    };
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json(
      { error: "Debug API error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 