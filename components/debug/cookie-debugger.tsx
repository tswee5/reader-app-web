"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { RefreshCw, Cookie, Shield, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CookieDebugger() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [clientCookies, setClientCookies] = useState<string | null>(null);

  // Test the cookie endpoint
  const testCookies = async () => {
    setIsLoading(true);
    try {
      // First, refresh the session to ensure we have fresh cookies
      await supabase.auth.refreshSession();
      
      // Wait a short moment for cookies to be set
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Get the client-side cookies
      setClientCookies(document.cookie);
      
      // Now test the endpoint
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/debug/cookie-test?t=${timestamp}`, {
        credentials: "include", // Important! Include cookies
        cache: "no-store" // Don't cache
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResults(data);
      } else {
        setTestResults({
          error: `API responded with status ${response.status}`,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setTestResults({
        error: String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Cookie className="mr-2 h-5 w-5" />
          Cookie Transmission Debugger
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={testCookies}
              disabled={isLoading}
              className="flex items-center"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Test Cookie Transmission
            </Button>
          </div>
          
          {testResults && (
            <div className="space-y-6 mt-4">
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Authentication Status
                </h3>
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge 
                    variant={testResults.authentication?.success ? "success" : "destructive"}
                    className={`flex items-center gap-1 ${testResults.authentication?.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                  >
                    {testResults.authentication?.success 
                      ? <><Check className="h-3 w-3" /> Authenticated</>
                      : <><X className="h-3 w-3" /> Not Authenticated</>
                    }
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {testResults.timestamp}
                  </span>
                </div>
                
                {testResults.authentication?.methods && (
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(testResults.authentication.methods).map(([method, data]: [string, any]) => (
                      <div key={method} className="border rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{method}</h4>
                          {data.success 
                            ? <Check className="h-4 w-4 text-green-500" />
                            : <X className="h-4 w-4 text-red-500" />
                          }
                        </div>
                        
                        {data.success && data.user && (
                          <p className="text-xs">User: {data.user.id}</p>
                        )}
                        
                        {data.success && data.session && (
                          <p className="text-xs">Expires: {data.session.expires_at}</p>
                        )}
                        
                        {data.error && (
                          <p className="text-xs text-red-500 mt-1 truncate" title={data.error.message}>
                            {data.error.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Cookie Information</h3>
                
                <div className="space-y-4">
                  {testResults.cookies?.authCookies && testResults.cookies.authCookies.length > 0 ? (
                    <div>
                      <h4 className="text-md font-medium mb-2">Auth Cookies ({testResults.cookies.authCookies.length})</h4>
                      <ul className="space-y-2">
                        {testResults.cookies.authCookies.map((cookie: any, index: number) => (
                          <li key={index} className="bg-muted p-2 rounded text-sm">
                            <div className="flex justify-between">
                              <span className="font-bold">{cookie.name}</span>
                              <span>{cookie.length} chars</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-md">
                      <p className="text-amber-800 text-sm">No auth cookies found in the request!</p>
                    </div>
                  )}
                  
                  {clientCookies && (
                    <div>
                      <h4 className="text-md font-medium mb-2">Client-Side Cookies</h4>
                      <div className="bg-muted p-3 rounded-md">
                        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                          {clientCookies}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {testResults.error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                  <p className="text-red-800 text-sm">Error: {testResults.error}</p>
                </div>
              )}
            </div>
          )}
          
          {!testResults && !isLoading && (
            <p className="text-muted-foreground">
              Click the button to test if cookies are being properly transmitted between client and server.
            </p>
          )}
          
          {isLoading && (
            <p className="text-muted-foreground">Testing cookie transmission...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 