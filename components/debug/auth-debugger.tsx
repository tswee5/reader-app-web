"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { RefreshCw, LogOut, LogIn, Bug } from "lucide-react";

export function AuthDebugger() {
  const [clientSession, setClientSession] = useState<any>(null);
  const [apiSession, setApiSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  // Get client-side session
  const fetchClientSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error fetching client session:", error);
      }
      setClientSession({
        exists: !!data.session,
        expiresAt: data.session?.expires_at 
          ? new Date(data.session.expires_at * 1000).toISOString()
          : null,
        accessTokenLength: data.session?.access_token?.length || 0,
        refreshTokenLength: data.session?.refresh_token?.length || 0,
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
      });
    } catch (e) {
      console.error("Error in fetchClientSession:", e);
    }
  };

  // Get API-side session from debug endpoint
  const fetchApiSession = async () => {
    setIsLoading(true);
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/debug/auth?t=${timestamp}`, {
        credentials: "include",
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiSession(data);
      } else {
        console.error("API session check failed:", response.status);
        setApiSession({
          error: `API responded with status ${response.status}`
        });
      }
    } catch (e) {
      console.error("Error in fetchApiSession:", e);
      setApiSession({
        error: e instanceof Error ? e.message : String(e)
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Attempt to refresh the session
  const refreshSession = async () => {
    setIsLoading(true);
    try {
      console.log("Manually refreshing session...");
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Session refresh error:", error);
      } else {
        console.log("Session refreshed successfully");
        setRefreshCount(prev => prev + 1);
      }
      
      // Update both client and API session data
      await fetchClientSession();
      await fetchApiSession();
    } catch (e) {
      console.error("Error in refreshSession:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Force sign out
  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      console.log("Signed out successfully");
      await fetchClientSession();
      await fetchApiSession();
    } catch (e) {
      console.error("Error signing out:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchClientSession();
    fetchApiSession();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center text-xl font-semibold">
          <Bug className="mr-2 h-5 w-5" />
          Authentication Debugger
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex gap-2 mb-6">
            <Button
              onClick={refreshSession}
              disabled={isLoading}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Session
            </Button>
            <Button
              onClick={signOut}
              disabled={isLoading}
              variant="outline"
              className="flex items-center"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
            <Button
              onClick={() => window.location.href = '/login'} 
              disabled={isLoading}
              variant="secondary"
              className="flex items-center ml-auto"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Client-side Session</h3>
              <div className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                <p><span className="text-blue-500">Session exists:</span> {clientSession?.exists ? "Yes" : "No"}</p>
                {clientSession?.expiresAt && (
                  <p><span className="text-blue-500">Expires at:</span> {clientSession.expiresAt}</p>
                )}
                {clientSession?.accessTokenLength > 0 && (
                  <p><span className="text-blue-500">Access token length:</span> {clientSession.accessTokenLength}</p>
                )}
                {clientSession?.refreshTokenLength > 0 && (
                  <p><span className="text-blue-500">Refresh token length:</span> {clientSession.refreshTokenLength}</p>
                )}
                {clientSession?.userId && (
                  <p><span className="text-blue-500">User ID:</span> {clientSession.userId}</p>
                )}
                {clientSession?.email && (
                  <p><span className="text-blue-500">Email:</span> {clientSession.email}</p>
                )}
                {!clientSession && <p>Loading session information...</p>}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">API-side Session</h3>
              <div className="bg-muted p-3 rounded-md text-sm font-mono overflow-x-auto">
                {apiSession?.auth?.sessionBefore && (
                  <>
                    <p><span className="text-green-500">Session exists:</span> {apiSession.auth.sessionBefore.exists ? "Yes" : "No"}</p>
                    {apiSession.auth.sessionBefore.expiresAt && (
                      <p><span className="text-green-500">Expires at:</span> {apiSession.auth.sessionBefore.expiresAt}</p>
                    )}
                    {apiSession.auth.sessionBefore.accessTokenLength > 0 && (
                      <p><span className="text-green-500">Access token length:</span> {apiSession.auth.sessionBefore.accessTokenLength}</p>
                    )}
                  </>
                )}
                {apiSession?.auth?.user && (
                  <>
                    <p><span className="text-green-500">User exists:</span> {apiSession.auth.user.exists ? "Yes" : "No"}</p>
                    {apiSession.auth.user.id && (
                      <p><span className="text-green-500">User ID:</span> {apiSession.auth.user.id}</p>
                    )}
                  </>
                )}
                {apiSession?.error && (
                  <p className="text-red-500">Error: {apiSession.error}</p>
                )}
                {!apiSession && <p>Loading API session information...</p>}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Cookies & Headers</h3>
            <div className="bg-muted p-3 rounded-md text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
              {apiSession?.request?.cookies && Array.isArray(apiSession.request.cookies) ? (
                <div>
                  <p className="text-purple-500 font-bold mb-2">Cookies sent to API:</p>
                  <ul className="space-y-2">
                    {apiSession.request.cookies.map((cookie: any, index: number) => (
                      <li key={index} className="border-b border-gray-700 pb-1">
                        <span className="text-yellow-500">{cookie.name}:</span> {cookie.length} chars
                        <br />
                        <span className="text-gray-400 text-xs">{cookie.preview}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No cookie information available</p>
              )}
            </div>
          </div>
          
          <div className="mt-3 text-sm text-muted-foreground">
            <p>Session refresh attempts: {refreshCount}</p>
            <p>Last updated: {new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 