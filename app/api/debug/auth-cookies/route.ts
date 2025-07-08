export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from 'next/headers';

export async function GET(req: Request) {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  
  // Get raw headers to see what's actually being sent
  const requestHeaders = new Headers(req.headers);
  const cookieHeader = requestHeaders.get('cookie');
  
  // Specifically look for auth-related cookies
  const supabaseAuthCookie = cookieStore.get('supabase-auth');
  const sbCookie = cookieStore.get('sb');
  
  return NextResponse.json({
    time: new Date().toISOString(),
    allCookies: allCookies.map(c => ({
      name: c.name,
      value: c.value.substring(0, 20) + '...' + (c.value.length > 40 ? c.value.slice(-20) : ''),
      length: c.value.length
    })),
    rawCookieHeader: cookieHeader ? {
      length: cookieHeader.length,
      excerpt: cookieHeader.substring(0, 100) + '...'
    } : null,
    authCookies: {
      supabaseAuth: supabaseAuthCookie ? {
        exists: true,
        length: supabaseAuthCookie.value.length,
        preview: supabaseAuthCookie.value.substring(0, 30) + '...'
      } : null,
      sb: sbCookie ? {
        exists: true,
        length: sbCookie.value.length,
        preview: sbCookie.value.substring(0, 30) + '...'
      } : null
    }
  });
} 