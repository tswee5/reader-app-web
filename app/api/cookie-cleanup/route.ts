export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

/**
 * API route to explicitly clean up expired Supabase auth cookies
 */
export async function GET(req: Request) {
  try {
    // Get cookie store
    const cookieStore = cookies();
    const allCookies = cookieStore.getAll();
    
    // Find all Supabase-related cookies
    const supabaseCookies = allCookies.filter(c => 
      c.name === 'supabase-auth' || 
      c.name === 'sb-access-token' || 
      c.name === 'sb-refresh-token' || 
      c.name.startsWith('sb-') ||
      c.name.includes('-auth-token') // Also match project-specific auth tokens
    );
    
    console.log(`Found ${supabaseCookies.length} Supabase cookies for cleanup check`);
    
    // Detect JWT expiration in tokens
    const now = new Date();
    let expiredCount = 0;
    let deletedProjectTokens = 0;
    
    // For each cookie, check if it's a JWT and if it's expired
    for (const cookie of supabaseCookies) {
      try {
        // Special handling for project-specific auth tokens
        if (cookie.name.includes('-auth-token')) {
          console.log(`Deleting project-specific auth token: ${cookie.name}`);
          cookieStore.delete({
            name: cookie.name,
            path: '/',
          });
          deletedProjectTokens++;
          continue;
        }
        
        // For JWT cookies, try to extract expiry
        if (cookie.name === 'sb-access-token' || cookie.name === 'sb-refresh-token') {
          const parts = cookie.value.split('.');
          if (parts.length === 3) {
            try {
              // Decode the middle part (payload) of the JWT
              const payload = JSON.parse(atob(parts[1]));
              if (payload.exp) {
                const isExpired = now.getTime() / 1000 > payload.exp;
                if (isExpired) {
                  console.log(`Deleting expired cookie: ${cookie.name}`);
                  // Delete the cookie by setting maxage to 0 and expires to past
                  cookieStore.delete({
                    name: cookie.name,
                    path: '/',
                  });
                  expiredCount++;
                }
              }
            } catch (e) {
              console.error(`Error parsing JWT in cookie ${cookie.name}:`, e);
            }
          }
        }
        // For supabase-auth cookie, check if it's valid JSON
        else if (cookie.name === 'supabase-auth') {
          try {
            const parsedValue = JSON.parse(decodeURIComponent(cookie.value));
            if (!parsedValue.session || !parsedValue.user) {
              console.log(`Deleting invalid supabase-auth cookie`);
              cookieStore.delete({
                name: cookie.name,
                path: '/',
              });
              expiredCount++;
            }
          } catch (e) {
            console.error(`Error parsing supabase-auth cookie:`, e);
            // If we can't parse it, it's probably corrupted - delete it
            cookieStore.delete({
              name: cookie.name,
              path: '/',
            });
            expiredCount++;
          }
        }
        // For other sb- cookies, we don't have a good way to check, so leave them
      } catch (e) {
        console.error(`Error processing cookie ${cookie.name}:`, e);
      }
    }
    
    return NextResponse.json({ 
      status: "success", 
      message: `Cleanup complete. Found ${supabaseCookies.length} Supabase cookies, deleted ${expiredCount} expired cookies and ${deletedProjectTokens} project-specific tokens.`
    });
  } catch (error) {
    console.error("Cookie cleanup error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to clean up cookies",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 