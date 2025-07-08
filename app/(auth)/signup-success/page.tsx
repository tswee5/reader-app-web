"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";

function SignUpSuccessContent() {
  const { supabase } = useSupabase();
  const searchParams = useSearchParams();
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Extract email from URL parameters
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleResendEmail = async () => {
    if (!email) {
      setError("Email address not found. Please try signing up again.");
      return;
    }

    setIsResending(true);
    setError(null);
    
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (resendError) {
        setError(resendError.message);
        return;
      }

    setResent(true);
    
    // Reset the "resent" state after a few seconds
    setTimeout(() => setResent(false), 5000);
    } catch (error) {
      setError("An unexpected error occurred while resending the email. Please try again.");
      console.error("Resend error:", error);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
          <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        
        <h1 className="text-3xl font-bold">Check your email</h1>
        <div className="space-y-3">
          <p className="text-gray-500 dark:text-gray-400">
            We've sent you a confirmation email. Please check your inbox and click the verification link to activate your account.
          </p>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Next steps:</strong>
            </p>
            <ol className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 text-left">
              <li>1. Check your email inbox (and spam/junk folder)</li>
              <li>2. Click the verification link in our email</li>
              <li>3. Return here to sign in with your new account</li>
            </ol>
          </div>
        </div>

        {error && (
          <div className="text-sm font-medium text-destructive bg-red-50 dark:bg-red-950/30 p-3 rounded-md">
            {error}
          </div>
        )}

        {resent && (
          <div className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-md flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Please check for a new verification email
          </div>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/login">Continue to Sign In</Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleResendEmail}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Resending...
              </>
            ) : (
              "Didn't receive the email?"
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          <p>
            Having trouble? Make sure to check your spam folder. 
            The email should arrive within a few minutes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <div className="mx-auto max-w-md space-y-6 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold">Loading...</h1>
        </div>
      </div>
    }>
      <SignUpSuccessContent />
    </Suspense>
  );
} 