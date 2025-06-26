import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const type = requestUrl.searchParams.get("type");

  // Add detailed logging for debugging
  console.log("Auth callback received:", {
    code: code ? "present" : "missing",
    error,
    errorDescription,
    type,
    url: request.url
  });

  // Handle auth errors (prevents unwanted redirects)
  if (error) {
    console.error("Auth callback error:", error, errorDescription);
    
    // Check if it's a password reset error - redirect to login instead of reset password
    if (error === "access_denied" || errorDescription?.includes("email_not_confirmed")) {
      return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
    }
    
    // For other errors, redirect to login with error message
    return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`);
  }

  // Handle auth code exchange
  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    try {
      console.log("Attempting to exchange code for session...");
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("Error exchanging code for session:", exchangeError);
        return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
      }

      console.log("Code exchange successful:", {
        user: data.user?.id ? "present" : "missing",
        session: data.session ? "present" : "missing"
      });

      // Check the type of authentication flow
      if (type === "recovery" || type === "password_recovery") {
        // This is a password reset flow - redirect to update password
        return NextResponse.redirect(`${requestUrl.origin}/update-password`);
      }
      
      // For email verification, redirect to confirmation page
      if (data.user && data.session) {
        // Check if this is a new user verification (vs returning user)
        const isNewVerification = !data.user.last_sign_in_at || 
          (data.user.email_confirmed_at && new Date(data.user.email_confirmed_at) > new Date(data.user.last_sign_in_at));
        
        console.log("User verification status:", {
          isNewVerification,
          lastSignIn: data.user.last_sign_in_at,
          emailConfirmed: data.user.email_confirmed_at
        });
        
        if (isNewVerification) {
          return NextResponse.redirect(`${requestUrl.origin}/email-verified`);
        } else {
          // Returning user - go straight to library
          return NextResponse.redirect(`${requestUrl.origin}/library`);
        }
      }
      
      // Fallback - redirect to library
      return NextResponse.redirect(`${requestUrl.origin}/library`);
      
    } catch (error) {
      console.error("Unexpected error in auth callback:", error);
      return NextResponse.redirect(`${requestUrl.origin}/login?error=authentication_failed`);
    }
  }

  // No code provided - redirect to home
  console.log("No auth code provided, redirecting to home");
  return NextResponse.redirect(requestUrl.origin);
} 