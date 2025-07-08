export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/database.types';

/**
 * API route to explicitly refresh the Supabase auth token
 * This is useful in cases where the automatic refresh isn't working
 */
export async function POST() {
  try {
    // Get fresh cookies for the request
    const cookieStore = cookies();
    
    // Create a Supabase client specifically for API routes
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Step 1: Check if we have a session
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error getting current session:", sessionError);
      return NextResponse.json(
        { error: "Failed to retrieve current session", details: sessionError.message },
        { status: 500 }
      );
    }
    
    if (!currentSession) {
      return NextResponse.json(
        { error: "No active session found to refresh" },
        { status: 401 }
      );
    }
    
    // Step 2: Attempt to refresh the session
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error("Error refreshing session:", refreshError);
      return NextResponse.json(
        { error: "Failed to refresh session", details: refreshError.message },
        { status: 500 }
      );
    }
    
    if (!data.session) {
      return NextResponse.json(
        { error: "No session returned after refresh attempt" },
        { status: 500 }
      );
    }
    
    // Calculate and return expiration information for client awareness
    let expiresAt: string | null = null;
    let expiresIn: number | null = null;
    
    try {
      if (data.session.expires_at) {
        const expiryTimestamp = new Date(data.session.expires_at * 1000);
        expiresAt = expiryTimestamp.toISOString();
        expiresIn = Math.floor((expiryTimestamp.getTime() - Date.now()) / 1000);
      }
    } catch (e) {
      console.error("Error calculating expiry:", e);
    }
    
    // Return success with some non-sensitive session info
    return NextResponse.json({
      success: true,
      user: {
        id: data.session.user.id,
        email: data.session.user.email
      },
      expires: {
        at: expiresAt,
        in: expiresIn
      }
    });
  } catch (error) {
    console.error("Unexpected error during session refresh:", error);
    return NextResponse.json(
      { error: "Unexpected error during refresh" },
      { status: 500 }
    );
  }
} 