'use client';

/**
 * Force a refresh of the auth token by calling the refresh API
 * This is useful when the automatic token refresh isn't working
 * 
 * @returns A promise that resolves with the refresh result
 */
export async function forceTokenRefresh(): Promise<{
  success: boolean;
  error?: string;
  expiresIn?: number;
}> {
  try {
    // Call our API route to force a token refresh
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Include credentials to ensure cookies are sent
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Token refresh failed with status: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      expiresIn: data.expires?.in,
    };
  } catch (error) {
    console.error('Error during force token refresh:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during token refresh',
    };
  }
}

/**
 * Check if the current session appears to be expired by making a quick auth check
 * This is useful to determine if we need to force a token refresh
 * 
 * @returns A promise that resolves with boolean indicating if session appears valid
 */
export async function checkSessionValid(): Promise<boolean> {
  try {
    // Make a quick request to an auth-protected endpoint
    const response = await fetch('/api/auth-status', {
      method: 'GET',
      credentials: 'include',
    });
    
    // If we get a 401, the session is likely expired
    if (response.status === 401) {
      return false;
    }
    
    // Any other non-2xx status means something else is wrong
    if (!response.ok) {
      console.error('Auth check failed with status:', response.status);
      return false;
    }
    
    // Session is valid
    return true;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
} 