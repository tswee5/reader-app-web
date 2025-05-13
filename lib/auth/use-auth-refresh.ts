'use client';

import { useState, useCallback } from 'react';
import { forceTokenRefresh, checkSessionValid } from './force-refresh';
import { supabase } from '@/lib/supabase/client';

/**
 * React hook for managing auth token refresh
 * Provides functions to check session validity and force a refresh when needed
 */
export function useAuthRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  /**
   * Checks if the current session is valid
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  }, []);

  /**
   * Forces a token refresh using our API endpoint
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    setIsRefreshing(true);
    setRefreshError(null);
    
    try {
      const result = await forceTokenRefresh();
      
      if (result.success) {
        setLastRefreshed(new Date());
        return true;
      } else {
        setRefreshError(result.error || 'Unknown refresh error');
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setRefreshError(message);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Auto-refreshes the token if the session appears to be invalid
   * Returns true if session is valid (either initially or after refresh)
   */
  const ensureValidSession = useCallback(async (): Promise<boolean> => {
    const isValid = await validateSession();
    
    if (isValid) {
      return true;
    }
    
    // Session is invalid, try to refresh
    const refreshSuccessful = await refreshToken();
    return refreshSuccessful;
  }, [validateSession, refreshToken]);

  return {
    isRefreshing,
    lastRefreshed,
    refreshError,
    refreshToken,
    validateSession,
    ensureValidSession,
  };
} 