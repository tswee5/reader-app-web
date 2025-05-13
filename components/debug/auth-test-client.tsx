"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";

export function AuthTestClient() {
  const [clientSession, setClientSession] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Run test on the endpoint we created
  const testAuthCookies = async () => {
    setIsLoading(true);
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/debug/auth-cookies?t=${timestamp}`, {
        credentials: "include" // Important!
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResults(prev => [
          {
            type: "auth-cookies",
            timestamp: new Date().toISOString(),
            status: response.status,
            data
          },
          ...prev
        ]);
      } else {
        setTestResults(prev => [
          {
            type: "auth-cookies",
            timestamp: new Date().toISOString(),
            status: response.status,
            error: `Failed with status ${response.status}`
          },
          ...prev
        ]);
      }
    } catch (error) {
      setTestResults(prev => [
        {
          type: "auth-cookies",
          timestamp: new Date().toISOString(),
          error: String(error)
        },
        ...prev
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Test making a direct request to the summarize endpoint
  const testSummarizeEndpoint = async () => {
    setIsLoading(true);
    try {
      // First refresh the session
      await supabase.auth.refreshSession();
      
      // Then make a request to the summarize endpoint with test data
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/ai/summarize?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: "test-article-id",
          content: "This is a test article for summarization."
        }),
        credentials: "include", // Include auth cookies
        cache: "no-store" // Prevent caching
      });
      
      // Record the results
      let resultData;
      try {
        resultData = await response.json();
      } catch (e) {
        resultData = "Failed to parse response";
      }
      
      setTestResults(prev => [
        {
          type: "summarize-test",
          timestamp: new Date().toISOString(),
          status: response.status,
          data: resultData
        },
        ...prev
      ]);
    } catch (error) {
      setTestResults(prev => [
        {
          type: "summarize-test",
          timestamp: new Date().toISOString(),
          error: String(error)
        },
        ...prev
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchClientSession();
  }, []);

  return (
    <Card className="w-full mb-8">
      <CardHeader>
        <CardTitle>Authentication Test Tool</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Button 
              onClick={fetchClientSession} 
              disabled={isLoading}
            >
              Refresh Session Data
            </Button>
            <Button 
              onClick={testAuthCookies} 
              disabled={isLoading}
              variant="outline"
            >
              Test Auth Cookies
            </Button>
            <Button 
              onClick={testSummarizeEndpoint} 
              disabled={isLoading}
              variant="secondary"
            >
              Test Summarize API
            </Button>
          </div>
          
          {clientSession && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Client Session:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(clientSession, null, 2)}
              </pre>
            </div>
          )}
          
          {testResults.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Test Results:</h3>
              <div className="space-y-3">
                {testResults.map((result, i) => (
                  <div key={i} className="p-3 bg-muted rounded-md">
                    <div className="flex justify-between">
                      <span className="font-medium">{result.type}</span>
                      <span className="text-xs">{result.timestamp}</span>
                    </div>
                    {result.status && (
                      <div className="text-sm mt-1">
                        Status: <span className={result.status >= 200 && result.status < 300 ? "text-green-500" : "text-red-500"}>
                          {result.status}
                        </span>
                      </div>
                    )}
                    {result.error && (
                      <div className="text-sm text-red-500 mt-1">
                        Error: {result.error}
                      </div>
                    )}
                    {result.data && (
                      <pre className="text-xs mt-2 overflow-auto max-h-64">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 