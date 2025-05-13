import { supabase } from "@/lib/supabase/client";

/**
 * Attempts to refresh the current Supabase auth session
 * With the updated Supabase auth helpers, session refresh is largely handled automatically, 
 * but this function provides an explicit way to refresh when needed.
 * 
 * Returns true if the session was successfully refreshed, false otherwise
 */
export async function refreshSession(): Promise<boolean> {
  try {
    console.log("Attempting to refresh auth session...");
    
    // First, check if we have a current session
    const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Error getting current session:", sessionError);
      return false;
    }
    
    if (!currentSession) {
      console.log("No active session found to refresh");
      return false;
    }
    
    console.log("Found session to refresh for user:", currentSession.user.id);
    
    // Try to refresh the session to get new tokens
    const { data, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.error("Error refreshing session:", refreshError);
      return false;
    }
    
    if (!data.session) {
      console.log("No session returned after refresh attempt");
      return false;
    }
    
    console.log("Session successfully refreshed for user:", data.session.user.id);
    
    // If we have debugging enabled, calculate token expiry time
    if (process.env.NODE_ENV === 'development') {
      try {
        const decodedToken = JSON.parse(
          Buffer.from(data.session.access_token.split('.')[1], 'base64').toString()
        );
        const expiryDate = new Date(decodedToken.exp * 1000);
        console.log('New token expires at:', expiryDate.toISOString());
        
        // Calculate remaining time in minutes
        const remainingMinutes = Math.round((expiryDate.getTime() - Date.now()) / (60 * 1000));
        console.log(`New token expires in ${remainingMinutes} minutes`);
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }
    
    return true;
  } catch (e) {
    console.error("Unexpected error during session refresh:", e);
    return false;
  }
}

/**
 * Attempts to ensure the auth cookie is properly set by re-setting it from localStorage
 * This is a last-resort approach to fix cookie issues
 */
export async function setFreshAuthCookie(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    // Try to get auth data from localStorage
    const localStorageData = localStorage.getItem('supabase-auth');
    if (!localStorageData) {
      console.log("No auth data in localStorage to set as cookie");
      return false;
    }
    
    // Parse it to make sure it's valid
    const authData = JSON.parse(localStorageData);
    if (!authData) {
      console.log("Invalid auth data in localStorage");
      return false;
    }
    
    // Extract only the minimal necessary data to avoid cookie size issues
    let minimalData = localStorageData;
    try {
      const parsed = JSON.parse(localStorageData);
      if (parsed && typeof parsed === 'object') {
        const minimal = {
          session: parsed.session ? {
            access_token: parsed.session.access_token,
            refresh_token: parsed.session.refresh_token,
            expires_at: parsed.session.expires_at,
            expires_in: parsed.session.expires_in
          } : null,
          user: parsed.user ? {
            id: parsed.user.id,
            email: parsed.user.email
          } : null
        };
        minimalData = JSON.stringify(minimal);
      }
    } catch (e) {
      console.error("Error creating minimal cookie data:", e);
    }
    
    // Get current hostname to set correct domain
    const hostname = window.location.hostname;
    // Default to domain-less cookie for localhost, otherwise add domain
    const domainPart = hostname === 'localhost' ? '' : `; domain=${hostname}`;
    
    // Re-set the cookie with the correct attributes for API route access
    // Use multiple approaches to maximize compatibility
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    
    // First set without secure flag for localhost
    document.cookie = `supabase-auth=${encodeURIComponent(minimalData)}; path=/; max-age=${maxAge}${domainPart}; SameSite=Lax`;
    
    // For good measure, set with httpOnly:false explicitly
    document.cookie = `sb-auth-token=${encodeURIComponent(minimalData)}; path=/; max-age=${maxAge}${domainPart}; SameSite=Lax; httpOnly=false`;
    
    // Also try setting as a simple session cookie without all the attributes
    document.cookie = `supabase-fallback=${encodeURIComponent(minimalData)}; path=/`;
    
    console.log("Manually set fresh auth cookies with multiple approaches");
    console.log("Current cookies after setting:", document.cookie.includes('supabase-auth'));
    return true;
  } catch (e) {
    console.error("Error setting fresh auth cookie:", e);
    return false;
  }
} 