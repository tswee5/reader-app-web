"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase, clearOldAuthState } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";

type SupabaseContext = {
  supabase: SupabaseClient<Database, 'public'>;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  refreshSession: () => Promise<void>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

// Session will be refreshed this often to prevent expiry
const SESSION_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Threshold in minutes to proactively refresh tokens
const REFRESH_THRESHOLD_MINUTES = 30;

export interface SupabaseProviderProps {
  children: React.ReactNode;
}

export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error fetching session:", error);
        return;
      }
      
      if (!currentSession) {
        console.log("No active session found during refresh");
        setSession(null);
        setUser(null);
      } else {
        // Check if token is close to expiry
        const shouldRefresh = checkIfRefreshNeeded(currentSession);
        
        if (shouldRefresh) {
          console.log("Token is close to expiry, refreshing proactively");
          // If we have a session, try to refresh it to get a new access token
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error("Error refreshing session:", refreshError);
            // Still use the current session if refresh fails
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
          } else {
            console.log("Session successfully refreshed for user:", data.session?.user.id);
            setSession(data.session);
            setUser(data.session?.user ?? null);
          }
        } else {
          console.log("Session is still valid, no refresh needed");
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      }
    } catch (err) {
      console.error("Unexpected error during session refresh:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper function to check if token needs refreshing
  const checkIfRefreshNeeded = (session: Session): boolean => {
    if (!session.expires_at) return false;
    
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    const diffMinutes = Math.floor((expiresAt.getTime() - now.getTime()) / (60 * 1000));
    
    // Refresh if token expires in less than threshold minutes
    return diffMinutes < REFRESH_THRESHOLD_MINUTES;
  };

  useEffect(() => {
    // Clear any old localStorage auth tokens to ensure we're using cookies
    if (typeof window !== 'undefined') {
      clearOldAuthState();
    }

    // Initial session check
    refreshSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log("Auth state changed:", event, currentSession?.user?.id);
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
        router.refresh();
      }
    );

    // Set up periodic session refresh to prevent token expiration
    // Only run if we're in a browser environment
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (typeof window !== 'undefined') {
      refreshInterval = setInterval(() => {
        console.log("Running scheduled session refresh");
        refreshSession();
      }, SESSION_REFRESH_INTERVAL);
    }

    // Clean up listeners and intervals on unmount
    return () => {
      subscription.unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [router, refreshSession]);

  const value = {
    supabase,
    user,
    session,
    isLoading,
    refreshSession,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
}; 