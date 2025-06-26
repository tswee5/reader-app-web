"use client";

import { useState, useCallback } from "react";
import { Bot, RotateCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface ArticleSummarizerProps {
  articleId: string;
  content: string;
}

export function ArticleSummarizer({ articleId, content }: ArticleSummarizerProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Attempt to refresh the session with enhanced logging
  const trySessionRefresh = useCallback(async (): Promise<boolean> => {
    try {
      console.log('Attempting to refresh session for article summarizer...');
      
      // First check current session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const expiresAt = sessionData.session.expires_at 
          ? new Date(sessionData.session.expires_at * 1000)
          : null;
        
        console.log('Current session expires at:', expiresAt?.toISOString() || 'unknown');
        
        // If session expires in more than 5 minutes, consider it valid
        if (expiresAt && expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
          console.log('Current session is still valid');
          return true;
        }
        
        console.log('Session expiring soon, refreshing...');
      } else {
        console.log('No active session found');
      }
      
      // Perform the refresh
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        
        // If we get an error about invalid refresh token, we need to redirect to login
        if (error.message.includes('Invalid refresh token') || 
            error.message.includes('Token expired')) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          
          // Force redirection to login after a short delay
          setTimeout(() => {
            router.push('/login');
          }, 2000);
          
          return false;
        }
        
        return false;
      }
      
      if (data.session) {
        console.log('Session successfully refreshed');
        // Log the session expiry time for debugging
        const expiryTime = data.session.expires_at 
          ? new Date(data.session.expires_at * 1000).toISOString()
          : 'unknown';
        console.log(`New session expires at: ${expiryTime}`);
        
        // IMPORTANT: Wait a moment to ensure cookies are properly set
        await new Promise(resolve => setTimeout(resolve, 300));
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Error during session refresh:', e);
      return false;
    }
  }, [router, toast]);

  const generateSummary = async (retryCount = 0) => {
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    
    try {
      // Always try to refresh the session first
      if (retryCount === 0) {
        console.log("Proactively refreshing session before API call");
        const refreshed = await trySessionRefresh();
        
        // Add a brief delay after session refresh to ensure cookies are set
        if (refreshed) {
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log("Session refreshed, cookies should be set");
        } else {
          console.log("Session refresh failed or not needed");
        }
      }
      
      // Use the hybrid approach - let the server handle URL vs content
      const fullContent = content;

      // Add a timestamp to avoid caching issues
      const timestamp = new Date().getTime();
      
      // Log all available cookies for debugging
      console.log("Cookies being sent:", document.cookie ? "Yes" : "No");
      
      console.log(`Making API request to summarize article ${articleId}`);
      const response = await fetch(`/api/ai/summarize?t=${timestamp}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          content: fullContent,
        }),
        credentials: "include", // Include auth cookies
        cache: "no-store" // Prevent caching
      });

      // Log response details for debugging
      console.log(`Summarize API response status: ${response.status}`);

      if (!response.ok) {
        // Get detailed error if available
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        let errorDetails = null;
        
        try {
          const errorData = await response.json();
          console.error("API error details:", errorData);
          
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          
          if (errorData.details) {
            errorDetails = errorData.details;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        
        // If we got a 401 auth error and haven't retried too many times
        if (response.status === 401 && retryCount < 2) {
          console.log(`Auth error in summarize API, attempt ${retryCount + 1} to refresh session`);
          
          // Try to refresh the session with a longer delay
          const refreshSuccessful = await trySessionRefresh();
          
          if (refreshSuccessful) {
            // If refresh succeeded, wait a moment and retry
            console.log("Session refresh successful, retrying summarize request after delay");
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsLoading(false);
            return generateSummary(retryCount + 1);
          } else {
            // If session refresh failed on a 401, it's likely a login issue
            setError("Authentication failed");
            setErrorDetails("Your session has expired. Please try logging out and back in.");
            
            toast({
              title: "Session Error",
              description: "Authentication failed. Please log in again.",
              variant: "destructive",
            });
          }
        } else {
          // For other errors or if we've exhausted our retries
          setError(errorMessage);
          if (errorDetails) {
            setErrorDetails(errorDetails);
          }
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      console.error("Error generating summary:", err);
      
      // Set default error message if none is already set
      if (!error) {
        setError("Failed to generate summary. Please try again.");
      }
      
      // Add error details if it's an Error object with message
      if (err instanceof Error && !errorDetails) {
        setErrorDetails(err.message);
      }
      
      toast({
        title: "Error",
        description: "Failed to generate article summary",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Bot className="mr-1 h-4 w-4" />
            Article Summary
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-3 py-2">
        {!summary && !isLoading && (
          <div className="flex flex-col items-center justify-center py-2">
            <p className="text-xs text-muted-foreground mb-2 text-center">
              Get a brief summary of the key points
            </p>
            <Button onClick={() => generateSummary()} className="w-full h-8 text-sm">
              Generate Summary
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-2 py-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex items-center justify-center mt-3">
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            <p className="font-medium">{error}</p>
            {errorDetails && (
              <p className="mt-1 text-xs opacity-80">{errorDetails}</p>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setError(null);
                setErrorDetails(null);
                generateSummary();
              }}
              className="w-full mt-2 h-8 text-xs"
            >
              <RotateCw className="mr-1 h-3 w-3" /> Try Again
            </Button>
          </div>
        )}

        {summary && !isLoading && !error && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="text-sm leading-relaxed">
              <ReactMarkdown>
                {summary}
              </ReactMarkdown>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                setSummary(null);
                setError(null);
                setErrorDetails(null);
                generateSummary();
              }}
              className="w-full mt-2 text-xs h-7"
            >
              <RotateCw className="mr-1 h-3 w-3" /> Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 