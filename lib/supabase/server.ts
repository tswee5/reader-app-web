import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from './database.types';

/**
 * Creates a Supabase client for server components and API routes
 * This ensures proper session management on the server side
 */
export function createServerSupabaseClient() {
  // Get fresh cookies each time
  const cookieStore = cookies();
  
  // Debug cookie information in development
  if (process.env.NODE_ENV === 'development') {
    const allCookies = cookieStore.getAll();
    const authCookies = allCookies.filter(cookie => 
      cookie.name === 'supabase-auth' || 
      cookie.name.startsWith('sb-')
    );
    
    console.log('Server Supabase client auth cookies:', 
      authCookies.map(c => ({
        name: c.name,
        length: c.value.length
      }))
    );
    
    // Check for potential issues
    if (authCookies.length === 0) {
      console.warn('No Supabase auth cookies found - authentication will likely fail');
    }
  }
  
  return createServerComponentClient<Database>({ cookies });
}

/**
 * Debug helper to decode JWT token and extract expiry information
 */
export function decodeJwtExpiry(token: string): { expiresAt: Date | null, isExpired: boolean } {
  try {
    // Split the token and get the payload (middle part)
    const parts = token.split('.');
    if (parts.length !== 3) return { expiresAt: null, isExpired: true };
    
    // Decode the base64 payload
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64').toString()
    );
    
    // Extract expiry timestamp
    if (!payload.exp) return { expiresAt: null, isExpired: true };
    
    const expiresAt = new Date(payload.exp * 1000);
    const isExpired = new Date() > expiresAt;
    
    return { expiresAt, isExpired };
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return { expiresAt: null, isExpired: true };
  }
} 