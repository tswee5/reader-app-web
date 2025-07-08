export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';

export async function GET(req: Request) {
  try {
    // Get a reference to the request headers for logging
    const headers = new Headers(req.headers);
    const cookieHeader = headers.get('cookie');
    
    // Get raw cookie information
    const rawCookieInfo = {
      exists: !!cookieHeader,
      length: cookieHeader?.length || 0,
      preview: cookieHeader ? cookieHeader.substring(0, 100) + '...' : 'No cookie header'
    };
    
    // Parse individual cookies
    const parsedCookies = cookieHeader 
      ? cookieHeader.split(';')
          .map(c => c.trim())
          .map(c => {
            const [name, ...rest] = c.split('=');
            const value = rest.join('=');
            return {
              name,
              length: value.length,
              preview: value.length > 20 ? value.substring(0, 20) + '...' : value
            };
          })
      : [];
    
    // Look specifically for auth cookies
    const authCookies = parsedCookies.filter(c => 
      c.name === 'supabase-auth' || 
      c.name.startsWith('sb-') || 
      c.name === 'sb'
    );
    
    // Initialize the route handler client with cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Test all authentication methods
    // 1. Get User
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    // 2. Get Session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    // 3. Refresh Session
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    // Check if we successfully authenticated with any method
    const authenticated = 
      (userData?.user && !userError) || 
      (sessionData?.session && !sessionError) || 
      (refreshData?.session && !refreshError);
    
    // Build response data
    const responseData = {
      timestamp: new Date().toISOString(),
      cookies: {
        raw: rawCookieInfo,
        parsed: parsedCookies,
        authCookies
      },
      authentication: {
        success: authenticated,
        methods: {
          getUser: {
            success: !!userData?.user && !userError,
            user: userData?.user ? {
              id: userData.user.id,
              email: userData.user.email,
            } : null,
            error: userError
          },
          getSession: {
            success: !!sessionData?.session && !sessionError,
            session: sessionData?.session ? {
              expires_at: sessionData.session.expires_at 
                ? new Date(sessionData.session.expires_at * 1000).toISOString()
                : null,
              user_id: sessionData.session.user?.id
            } : null,
            error: sessionError
          },
          refreshSession: {
            success: !!refreshData?.session && !refreshError,
            session: refreshData?.session ? {
              expires_at: refreshData.session.expires_at 
                ? new Date(refreshData.session.expires_at * 1000).toISOString()
                : null,
              user_id: refreshData.session.user?.id
            } : null,
            error: refreshError
          }
        }
      }
    };
    
    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json(
      { error: "Debug API error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 