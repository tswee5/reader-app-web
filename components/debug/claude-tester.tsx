"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ClaudeTester() {
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testClaudeApi = async () => {
    setIsLoading(true);
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/debug/claude?t=${timestamp}`, {
        credentials: "include",
        cache: "no-store"
      });
      
      const data = await response.json();
      setApiStatus(data);
    } catch (error) {
      setApiStatus({
        success: false,
        error: {
          message: error instanceof Error ? error.message : String(error)
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center text-xl font-semibold">
          Claude API Connectivity Test
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="flex gap-2 mb-6">
            <Button
              onClick={testClaudeApi}
              disabled={isLoading}
              className="flex items-center"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Test Claude API
            </Button>
          </div>
          
          {apiStatus && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="font-medium">Status:</span>
                {apiStatus.success ? (
                  <Badge variant="outline" className="bg-green-500 text-white flex items-center gap-1">
                    <Check className="h-3 w-3" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Error
                  </Badge>
                )}
              </div>
              
              {apiStatus.apiKeyInfo && (
                <div className="mb-4 bg-muted p-3 rounded-md text-sm">
                  <h3 className="font-medium mb-1">API Key Information:</h3>
                  <p>Key exists: {apiStatus.apiKeyInfo.exists ? 'Yes' : 'No'}</p>
                  <p>Key length: {apiStatus.apiKeyInfo.length} characters</p>
                  <p>Key prefix: {apiStatus.apiKeyInfo.prefix}</p>
                  <p>Authentication method: {apiStatus.apiKeyInfo.authMethod}</p>
                </div>
              )}
              
              {apiStatus.success && apiStatus.models && Array.isArray(apiStatus.models) && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2">Available Models:</h3>
                  <div className="bg-muted p-3 rounded-md text-sm overflow-x-auto max-h-60 overflow-y-auto">
                    <ul className="space-y-3">
                      {apiStatus.models.map((model: any, index: number) => (
                        <li key={index} className="border-b border-gray-200 pb-2">
                          <span className="font-bold text-blue-500">{model.id}</span>
                          <p className="text-xs text-gray-600">{model.description}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {!apiStatus.success && apiStatus.error && (
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-red-500">Error:</h3>
                  <div className="bg-red-50 p-3 rounded-md text-sm font-mono border border-red-200 overflow-x-auto max-h-60 overflow-y-auto">
                    {apiStatus.error.message ? (
                      <p>{apiStatus.error.message}</p>
                    ) : (
                      <>
                        <p>Status: {apiStatus.error.status} {apiStatus.error.statusText}</p>
                        <pre className="text-xs mt-2 whitespace-pre-wrap">
                          {JSON.stringify(apiStatus.error.details, null, 2)}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!apiStatus && !isLoading && (
            <p className="text-muted-foreground">Click the button to test connectivity to the Claude API.</p>
          )}
          
          {isLoading && (
            <p className="text-muted-foreground">Testing API connection...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 