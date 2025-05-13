import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/supabase/database.types';

/**
 * Middleware that ensures Supabase auth cookies are properly handled
 * For every API request, we:
 * 1. Get the session (which refreshes tokens when needed)
 * 2. Ensure all auth cookies have consistent attributes
 * 3. For auth-required routes, validate the session
 */
export async function middleware(req: NextRequest) {
  // Create a response to modify
  const res = NextResponse.next();
  
  // Create middleware client
  const supabase = createMiddlewareClient<Database>({ req, res });
  
  try {
    // Check if this is the home page route
    const isHomePage = req.nextUrl.pathname === '/';
    
    // If it's the home page, just return the response without further processing
    if (isHomePage) {
      return res;
    }
    
    // Determine if the route requires authentication
    const isAuthRoute = req.nextUrl.pathname.startsWith('/api/ai/') || 
                        req.nextUrl.pathname.startsWith('/api/user/') || 
                        req.nextUrl.pathname.startsWith('/api/articles/') ||
                        req.nextUrl.pathname.startsWith('/api/debug/') ||
                        req.nextUrl.pathname.startsWith('/api/auth-status') ||
                        req.nextUrl.pathname.startsWith('/api/tts/') ||
                        req.nextUrl.pathname.startsWith('/api/parse-article');
    
    // Always get the session - this is critical as it refreshes tokens automatically
    // This will update cookies in the response automatically using the res parameter
    const { data: { session } } = await supabase.auth.getSession();
    
    // If we have a session and it's an auth route, enforce authentication
    if (isAuthRoute && !session) {
      // Return 401 for routes requiring authentication if no session exists
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get all request cookies for analysis
    const requestCookies = req.cookies.getAll();
    
    // Check for project-specific legacy auth tokens that should be cleaned up
    const projectSpecificTokens = requestCookies.filter(c => 
      c.name.includes('-auth-token') && !c.name.startsWith('sb-')
    );
    
    // Always clean up project-specific auth tokens as they're usually stale
    for (const cookie of projectSpecificTokens) {
      console.log(`Cleaning up project-specific auth token: ${cookie.name}`);
      res.cookies.set({
        name: cookie.name,
        value: "",
        path: '/',
        expires: new Date(0),
        maxAge: 0
      });
    }
    
    // The middleware client automatically manages cookie refresh and proper attributes
    // so we don't need the manual cookie setting logic that was here before
  } catch (error) {
    console.error('Middleware error:', error);
  }
  
  return res;
}

// Run this middleware on all API routes that might need auth
export const config = {
  matcher: [
    '/api/ai/:path*',
    '/api/debug/:path*',
    '/api/auth-status',
    '/api/auth/refresh',
    '/api/user/:path*',
    '/api/articles/:path*',
    '/api/tts/:path*',
    '/api/parse-article',
    '/api/cookie-cleanup',
    '/auth-debug',
  ],
}; 