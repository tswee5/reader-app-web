"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Clock, RefreshCw, X, Trash } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function SessionDebugger() {
  const [isLoading, setIsLoading] = useState(false);
  const [clientSession, setClientSession] = useState<any>(null);
  const [serverSession, setServerSession] = useState<any>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>('');
  const { toast } = useToast();

  // Update the time only client-side to prevent hydration mismatch
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
  }, [refreshCount]);

  // Get client-side session
  const fetchClientSession = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Client session error:", error);
      }

      // Format the session data for display
      setClientSession({
        exists: !!data.session,
        error: error,
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
        expiresAt: data.session?.expires_at 
          ? new Date(data.session.expires_at * 1000).toISOString()
          : null,
        accessTokenLength: data.session?.access_token?.length || 0,
        refreshTokenLength: data.session?.refresh_token?.length || 0,
        raw: data
      });
    } catch (e) {
      console.error("Error fetching client session:", e);
      setClientSession({ error: e instanceof Error ? e.message : String(e) });
    }
  };

  // Get server-side session data from our debug endpoint
  const fetchServerSession = async () => {
    setIsLoading(true);
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/debug/session-cookie?t=${timestamp}`, {
        credentials: "include",
        cache: "no-store"
      });
      
      if (response.ok) {
        const data = await response.json();
        setServerSession(data);
      } else {
        console.error("Server session check failed:", response.status);
        setServerSession({
          error: `API responded with status ${response.status}`
        });
      }
    } catch (e) {
      console.error("Error in fetchServerSession:", e);
      setServerSession({
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
      
      // Perform client-side refresh
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error("Session refresh error:", error);
        toast({
          title: "Session refresh failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log("Session refreshed successfully");
        
        // Explicitly set the session to ensure it's properly passed to the browser
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
          console.log("Session explicitly set in browser after refresh");
        }
        
        setRefreshCount(prev => prev + 1);
        toast({
          title: "Session refreshed",
          description: "Your session was successfully refreshed",
          duration: 3000
        });
      }
      
      // Update both client and server session data
      await fetchClientSession();
      await fetchServerSession();
    } catch (e) {
      console.error("Error in refreshSession:", e);
      toast({
        title: "Refresh error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
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
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
        duration: 3000
      });
      await fetchClientSession();
      await fetchServerSession();
    } catch (e) {
      console.error("Error signing out:", e);
      toast({
        title: "Sign out error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new function to clean cookies
  const cleanCookies = async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/cookie-cleanup?t=${timestamp}`, {
        credentials: "include"
      });
      
      const data = await response.json();
      
      toast({
        title: response.ok ? "Cookies cleaned" : "Cookie cleanup failed",
        description: data.message || `Status: ${response.status}`,
        variant: response.ok ? "default" : "destructive",
        duration: 3000
      });
      
      // After cleaning cookies, trigger a page reload to ensure all tokens are refreshed
      // This is more thorough than just refreshing the data
      if (response.ok) {
        // First increment refresh count so the timestamp updates
        setRefreshCount(prev => prev + 1);
        
        // Then refresh data from both client and server
        await fetchClientSession();
        await fetchServerSession();
        
        // Finally, attempt to refresh the session to get new tokens
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (!error && data.session) {
            console.log("Session refreshed after cookie cleanup");
            
            // Explicitly set the session to ensure it's properly passed to the browser
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token
            });
            console.log("Session explicitly set in browser after cookie cleanup");
            
            // One more data refresh after the session refresh
            setTimeout(async () => {
              await fetchClientSession();
              await fetchServerSession();
            }, 500);
          }
        } catch (e) {
          console.error("Error refreshing session after cleanup:", e);
        }
      }
      
      console.log("Cookie cleanup response:", data);
    } catch (e) {
      console.error("Cookie cleanup error:", e);
      toast({
        title: "Cookie cleanup error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchClientSession();
    fetchServerSession();
  }, []);

  // Perform a test API call to verify authentication
  const testApiCall = async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/auth-status?t=${timestamp}`, {
        credentials: "include"
      });
      
      const data = await response.json();
      
      toast({
        title: response.ok ? "API call succeeded" : "API call failed",
        description: `Status: ${response.status}`,
        variant: response.ok ? "default" : "destructive",
        duration: 3000
      });
      
      console.log("API test response:", data);
    } catch (e) {
      console.error("API test error:", e);
      toast({
        title: "API test error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format expiry status
  const formatExpiryStatus = (expiryTime: string | null) => {
    if (!expiryTime) return null;
    
    const expiryDate = new Date(expiryTime);
    const now = new Date();
    
    // Check if expired
    if (now > expiryDate) {
      return { status: "expired", message: "Expired" };
    }
    
    // Calculate time remaining
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 5) {
      return { status: "warning", message: `Expires in ${diffMins} min` };
    } else if (diffMins < 60) {
      return { status: "ok", message: `Expires in ${diffMins} min` };
    } else {
      const diffHours = Math.round(diffMins / 60);
      return { status: "ok", message: `Expires in ${diffHours} hrs` };
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Supabase Session Debugger</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshSession}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Session
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={cleanCookies}
              disabled={isLoading}
            >
              <Trash className="h-4 w-4 mr-2" />
              Clean Cookies
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              disabled={isLoading}
            >
              Sign Out
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Debug Supabase session on both client and server side
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comparison" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="client">Client Session</TabsTrigger>
            <TabsTrigger value="server">Server Session</TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Client Side</h3>
                <div className="rounded-md bg-muted p-3">
                  {clientSession ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Session:</span>
                        {clientSession.exists ? (
                          <span className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded">Active</span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-800 py-0.5 px-2 rounded">None</span>
                        )}
                      </div>
                      
                      {clientSession.userId && (
                        <p className="text-xs mt-1">User ID: {clientSession.userId}</p>
                      )}
                      
                      {clientSession.expiresAt && (
                        <div className="flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <p className="text-xs">
                            {formatExpiryStatus(clientSession.expiresAt)?.message}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Server Side</h3>
                <div className="rounded-md bg-muted p-3">
                  {serverSession ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Session:</span>
                        {serverSession.authStatus?.sessionBefore?.exists ? (
                          <span className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded">Active</span>
                        ) : (
                          <span className="text-xs bg-red-100 text-red-800 py-0.5 px-2 rounded">None</span>
                        )}
                      </div>
                      
                      {serverSession.authStatus?.sessionBefore?.userId && (
                        <p className="text-xs mt-1">User ID: {serverSession.authStatus.sessionBefore.userId}</p>
                      )}
                      
                      {serverSession.authStatus?.sessionBefore?.expiresAt && (
                        <div className="flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          <p className="text-xs">
                            {formatExpiryStatus(serverSession.authStatus.sessionBefore.expiresAt)?.message}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  )}
                </div>
              </div>
            </div>
            
            <Button
              onClick={testApiCall}
              variant="secondary"
              className="w-full mt-4"
              disabled={isLoading}
            >
              Test API Authentication
            </Button>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Supabase Cookies</h3>
              <div className="rounded-md bg-muted p-3 overflow-auto max-h-60">
                {serverSession?.supabaseCookies?.length > 0 ? (
                  <div className="space-y-3">
                    {serverSession.supabaseCookies.map((cookie: any, index: number) => (
                      <div key={index} className="border-b border-border pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs">{cookie.name}</span>
                          {cookie.isValid !== undefined && (
                            cookie.isValid ? (
                              <span className="text-xs bg-green-100 text-green-800 py-0.5 px-2 rounded flex items-center">
                                <Check className="h-3 w-3 mr-1" /> Valid
                              </span>
                            ) : (
                              <span className="text-xs bg-red-100 text-red-800 py-0.5 px-2 rounded flex items-center">
                                <X className="h-3 w-3 mr-1" /> Expired
                              </span>
                            )
                          )}
                        </div>
                        
                        <p className="text-xs mt-1">Size: {cookie.valueLength} bytes</p>
                        
                        {cookie.expiresAt && (
                          <p className="text-xs mt-1">
                            Expires: {formatExpiryStatus(cookie.expiresAt)?.message}
                          </p>
                        )}
                        
                        {cookie.decodedData && (
                          <div className="mt-1 pt-1 border-t border-border">
                            <p className="text-xs">User ID: {cookie.decodedData.userId || "N/A"}</p>
                            <p className="text-xs">Session: {cookie.decodedData.hasSession ? "Yes" : "No"}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No Supabase cookies found</p>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="client">
            <div className="bg-muted p-4 rounded-md mt-4 overflow-auto max-h-96">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(clientSession, null, 2)}
              </pre>
            </div>
          </TabsContent>
          
          <TabsContent value="server">
            <div className="bg-muted p-4 rounded-md mt-4 overflow-auto max-h-96">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(serverSession, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          {currentTime && <p>Last refreshed: {currentTime}</p>}
          <p>Refresh count: {refreshCount}</p>
        </div>
      </CardContent>
    </Card>
  );
} 