export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';
import { createServerSupabaseClient, decodeJwtExpiry } from '@/lib/supabase/server';

/**
 * Diagnostic endpoint to analyze cookie issues
 * This endpoint shows:
 * 1. All cookies received by the server
 * 2. Attempts to verify the Supabase session
 * 3. Decodes and validates JWT tokens
 * 4. Identifies any issues with cookie transmission
 */
export async function GET(req: Request) {
  // Get a timestamp for the response
  const timestamp = new Date().toISOString();
  
  try {
    // 1. Examine Request Headers
    const headers = new Headers(req.headers);
    const cookieHeader = headers.get('cookie');
    
    // 2. Parse and analyze cookies
    const cookiesFromHeader = cookieHeader 
      ? cookieHeader.split(';')
          .map(c => c.trim())
          .map(c => {
            const [name, ...rest] = c.split('=');
            const value = rest.join('=');
            return { name, value };
          })
      : [];
    
    // Find all auth-related cookies
    const authCookies = cookiesFromHeader.filter(c => 
      c.name === 'supabase-auth' || 
      c.name.startsWith('sb-')
    );
    
    // 3. Check for JWT tokens and try to decode them
    const jwtAnalysis = authCookies
      .filter(c => c.name === 'sb-access-token' || c.name === 'sb-refresh-token')
      .map(c => {
        try {
          const tokenInfo = decodeJwtExpiry(c.value);
          return {
            name: c.name,
            valueLength: c.value.length,
            expiresAt: tokenInfo.expiresAt?.toISOString(),
            isExpired: tokenInfo.isExpired,
            isValid: !!tokenInfo.expiresAt && !tokenInfo.isExpired
          };
        } catch (e) {
          return {
            name: c.name,
            valueLength: c.value.length,
            error: 'Failed to decode token',
            isValid: false
          };
        }
      });
    
    // 4. Try to verify session using the Supabase client
    const cookieStore = cookies();
    const supabase = createServerSupabaseClient();
    
    // First check with getUser
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    // Then check with getSession
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    // Try a refresh
    let refreshData;
    let refreshError;
    
    // Only attempt refresh if we have an existing session
    if (sessionData?.session) {
      ({ data: refreshData, error: refreshError } = await supabase.auth.refreshSession());
    }
    
    // 5. Analyze raw cookie store
    const allCookiesFromStore = cookieStore.getAll();
    
    // 6. Detect issues
    const issues = [];
    
    // Check if no auth cookies present
    if (authCookies.length === 0) {
      issues.push({
        type: 'no_auth_cookies',
        severity: 'critical',
        message: 'No Supabase authentication cookies found in the request'
      });
    }
    
    // Check if tokens expired
    const expiredTokens = jwtAnalysis.filter(t => t.isExpired === true);
    if (expiredTokens.length > 0) {
      issues.push({
        type: 'expired_tokens',
        severity: 'high',
        message: `${expiredTokens.length} authentication tokens are expired`,
        tokens: expiredTokens.map(t => t.name)
      });
    }
    
    // Check for cookie/session mismatch
    if (authCookies.length > 0 && !userData?.user && !sessionData?.session) {
      issues.push({
        type: 'cookie_session_mismatch',
        severity: 'high',
        message: 'Auth cookies present but Supabase cannot establish a session',
        authCookieCount: authCookies.length
      });
    }
    
    // Check for refresh issues
    if (sessionData?.session && refreshError) {
      issues.push({
        type: 'refresh_error',
        severity: 'medium',
        message: 'Session exists but refresh failed: ' + refreshError.message
      });
    }
    
    // Compile final diagnosis
    const diagnosis = {
      timestamp,
      request: {
        url: req.url,
        method: req.method,
        hasAuthCookies: authCookies.length > 0,
        cookieHeaderLength: cookieHeader?.length || 0
      },
      cookies: {
        fromHeader: {
          total: cookiesFromHeader.length,
          auth: authCookies.map(c => ({
            name: c.name,
            length: c.value.length
          }))
        },
        fromStore: {
          total: allCookiesFromStore.length,
          names: allCookiesFromStore.map(c => c.name)
        }
      },
      tokens: jwtAnalysis,
      session: {
        user: {
          exists: !!userData?.user,
          id: userData?.user?.id,
          error: userError?.message
        },
        session: {
          exists: !!sessionData?.session,
          id: sessionData?.session?.id,
          userId: sessionData?.session?.user?.id,
          expiresAt: sessionData?.session?.expires_at 
            ? new Date(sessionData.session.expires_at * 1000).toISOString() 
            : null,
          error: sessionError?.message
        },
        refresh: {
          attempted: !!sessionData?.session,
          success: !!refreshData?.session && !refreshError,
          error: refreshError?.message
        }
      },
      issues
    };
    
    return NextResponse.json(diagnosis);
  } catch (error) {
    return NextResponse.json(
      { 
        timestamp,
        error: "Error during cookie diagnosis", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 