import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase/database.types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Debug endpoint to examine Supabase session cookies
 * This will help identify if old/stale cookies are being read by the server
 */
export async function GET(req: Request) {
  try {
    // Get detailed information about cookies from the request
    const headers = new Headers(req.headers);
    const cookieHeader = headers.get('cookie');

    // Parse cookies for easier examination
    const cookiesFromHeader = cookieHeader 
      ? cookieHeader.split(';')
          .map(c => c.trim())
          .map(c => {
            const [name, ...rest] = c.split('=');
            const value = rest.join('=');
            return { name, value };
          })
      : [];

    // Find all Supabase-related cookies
    const supabaseCookies = cookiesFromHeader.filter(c => 
      c.name === 'supabase-auth' || 
      c.name.startsWith('sb-') || 
      c.name === 'sb'
    );

    // Extract cookie details we care about while being careful with sensitive data
    const supabaseCookieDetails = supabaseCookies.map(cookie => {
      let decodedData = null;
      let expiryTimestamp = null;
      let isValid = false;

      // Try to parse and extract timestamp from cookie value (safely)
      try {
        if (cookie.value) {
          // For JWT cookies, try to extract expiry from the payload
          if (cookie.name === 'sb-access-token' && cookie.value.includes('.')) {
            const parts = cookie.value.split('.');
            if (parts.length === 3) {
              // Decode the middle part (payload) of the JWT
              const payload = JSON.parse(atob(parts[1]));
              if (payload.exp) {
                expiryTimestamp = new Date(payload.exp * 1000).toISOString();
                isValid = Date.now() < payload.exp * 1000;
              }
            }
          } 
          // For JSON cookies, try to parse the entire cookie
          else if (cookie.name === 'supabase-auth') {
            const parsedValue = JSON.parse(decodeURIComponent(cookie.value));
            
            // Check if this is the expected session format with expires_at
            if (parsedValue.session?.expires_at) {
              expiryTimestamp = new Date(parsedValue.session.expires_at * 1000).toISOString();
              isValid = Date.now() < parsedValue.session.expires_at * 1000;
            }
            
            // Extract useful metadata without sensitive tokens
            decodedData = {
              hasSession: !!parsedValue.session,
              hasUser: !!parsedValue.user,
              userId: parsedValue.user?.id,
              email: parsedValue.user?.email,
              accessTokenLength: parsedValue.session?.access_token?.length || 0,
              refreshTokenLength: parsedValue.session?.refresh_token?.length || 0
            };
          }
        }
      } catch (e) {
        console.error(`Error parsing cookie ${cookie.name}:`, e);
      }

      return {
        name: cookie.name,
        valueLength: cookie.value.length,
        valuePreview: cookie.value.substring(0, 20) + (cookie.value.length > 20 ? '...' : ''),
        expiresAt: expiryTimestamp,
        isValid,
        decodedData
      };
    });

    // Now, try to use the cookies to authenticate through the standard Supabase way
    // Use our improved client helper that ensures fresh cookies
    const supabase = createServerSupabaseClient();

    // Get user/session info
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    // Session refresh attempt
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

    // Log what's happening
    console.log('Session debug API:');
    console.log('- Session before refresh:', sessionData?.session ? 'Exists' : 'None');
    if (sessionError) console.log('- Session error:', sessionError.message);
    console.log('- Session after refresh:', refreshData?.session ? 'Exists' : 'None');
    if (refreshError) console.log('- Refresh error:', refreshError.message);

    // Compile the final debug info
    const debugInfo = {
      timestamp: new Date().toISOString(),
      request: {
        url: req.url,
        method: req.method,
        cookieHeader: cookieHeader ? `${cookieHeader.length} characters` : 'No cookie header',
        allCookiesCount: cookiesFromHeader.length,
        supabaseCookiesCount: supabaseCookies.length
      },
      supabaseCookies: supabaseCookieDetails,
      authStatus: {
        sessionBefore: {
          exists: !!sessionData?.session,
          error: sessionError ? sessionError.message : null,
          userId: sessionData?.session?.user?.id,
          expiresAt: sessionData?.session?.expires_at 
            ? new Date(sessionData.session.expires_at * 1000).toISOString() 
            : null,
          isActive: sessionData?.session?.expires_at 
            ? Date.now() < sessionData.session.expires_at * 1000 
            : false
        },
        sessionAfterRefresh: {
          refreshSucceeded: !!refreshData?.session && !refreshError,
          error: refreshError ? refreshError.message : null,
          userId: refreshData?.session?.user?.id,
          expiresAt: refreshData?.session?.expires_at 
            ? new Date(refreshData.session.expires_at * 1000).toISOString() 
            : null,
          isActive: refreshData?.session?.expires_at 
            ? Date.now() < refreshData.session.expires_at * 1000 
            : false
        }
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json(
      { 
        error: "Error analyzing session cookies", 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 