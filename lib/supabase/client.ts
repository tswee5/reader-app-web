'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from './database.types';

/**
 * Create a Supabase client for use in browser contexts
 * This implementation uses cookies for authentication which enables:
 * 1. Server-side access to authentication tokens
 * 2. Automatic handling of token refresh
 * 3. Proper session management between client and server
 */
export const supabase = createClientComponentClient<Database>({
  // We're using the newer recommended client
  // This client uses cookies by default with proper configuration
});

/**
 * Helper function to clear any old localStorage-based auth state
 * This helps transition users from localStorage to cookie-based auth
 */
export function clearOldAuthState() {
  if (typeof window === 'undefined') return;
  
  try {
    // Remove old localStorage items
    localStorage.removeItem('supabase-auth');
    localStorage.removeItem('supabase.auth.token');
    
    // Check for any other Supabase-related items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.') || key.startsWith('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    console.log('Cleared old authentication state from localStorage');
  } catch (e) {
    console.error('Error clearing old auth state:', e);
  }
} 