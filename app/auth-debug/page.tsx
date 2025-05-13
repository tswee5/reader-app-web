'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthRefresh } from '@/lib/auth/use-auth-refresh';
import { forceTokenRefresh } from '@/lib/auth/force-refresh';

// Auth debug component for testing and fixing auth issues
export default function AuthDebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [cookieInfo, setCookieInfo] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const { 
    isRefreshing, 
    lastRefreshed, 
    refreshError, 
    refreshToken, 
    validateSession,
    ensureValidSession
  } = useAuthRefresh();

  // Get session info on load
  useEffect(() => {
    async function getSessionInfo() {
      const { data } = await supabase.auth.getSession();
      setSessionInfo(data.session);
      setCookieInfo(document.cookie);
    }
    getSessionInfo();
  }, [lastRefreshed]);

  // Handle refresh button click
  const handleRefresh = async () => {
    setMessage('Refreshing token...');
    const success = await refreshToken();
    setMessage(success ? 'Token refreshed successfully!' : 'Token refresh failed');
  };

  // Handle force server refresh button click
  const handleForceServerRefresh = async () => {
    setMessage('Forcing server refresh...');
    try {
      const result = await forceTokenRefresh();
      if (result.success) {
        setMessage(`Token refreshed successfully! Expires in ${result.expiresIn} seconds`);
        // Refresh local session info
        const { data } = await supabase.auth.getSession();
        setSessionInfo(data.session);
        setCookieInfo(document.cookie);
      } else {
        setMessage(`Server refresh failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSessionInfo(null);
    setMessage('Signed out successfully');
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Auth Debugging Tool</h1>
      
      {message && (
        <div className="p-4 mb-4 bg-blue-100 border border-blue-300 rounded">
          {message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <div className="p-3 bg-gray-100 rounded">
            {sessionInfo ? (
              <span className="text-green-600 font-medium">
                ✅ Authenticated
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                ❌ Not authenticated
              </span>
            )}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-2">Last Refreshed</h2>
          <div className="p-3 bg-gray-100 rounded">
            {lastRefreshed ? (
              <span>{lastRefreshed.toLocaleTimeString()}</span>
            ) : (
              <span className="text-gray-500">Never</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Token (Client)'}
        </button>
        
        <button
          onClick={handleForceServerRefresh}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Force Server Refresh
        </button>
        
        {sessionInfo && (
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            Sign Out
          </button>
        )}
      </div>
      
      {refreshError && (
        <div className="p-4 mb-6 bg-red-100 border border-red-300 rounded">
          <h3 className="font-semibold mb-1">Refresh Error:</h3>
          <p>{refreshError}</p>
        </div>
      )}
      
      {sessionInfo && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Session Details</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
            <pre className="text-sm">
              {JSON.stringify(
                {
                  user: {
                    id: sessionInfo.user.id,
                    email: sessionInfo.user.email,
                  },
                  expires_at: sessionInfo.expires_at,
                  expires_in: sessionInfo.expires_at 
                    ? Math.floor(new Date(sessionInfo.expires_at * 1000).getTime() / 1000 - Date.now() / 1000)
                    : null,
                  provider: sessionInfo.user.app_metadata?.provider,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Cookie Information</h2>
        <div className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
          <p className="text-sm font-mono whitespace-pre-wrap mb-2">
            {cookieInfo || 'No cookies found'}
          </p>
          <h3 className="text-md font-semibold mt-4 mb-2">Supabase Cookies:</h3>
          <ul className="list-disc pl-5">
            {cookieInfo.split(';').map((cookie, i) => {
              const trimmed = cookie.trim();
              if (trimmed.startsWith('sb-') || trimmed.startsWith('supabase-')) {
                return <li key={i} className="text-sm font-mono">{trimmed}</li>;
              }
              return null;
            }).filter(Boolean)}
          </ul>
        </div>
      </div>
    </div>
  );
} 