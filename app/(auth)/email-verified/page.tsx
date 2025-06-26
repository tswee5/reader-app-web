"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";

export default function EmailVerifiedPage() {
  const router = useRouter();
  const { user } = useSupabase();
  const [isNewUser, setIsNewUser] = useState(false);

  // Check if this is a new user and redirect accordingly
  useEffect(() => {
    if (user) {
      // Check if user has completed onboarding by looking for display_name
      const hasDisplayName = user.user_metadata?.display_name || user.user_metadata?.full_name;
      
      if (!hasDisplayName) {
        // New user - redirect to onboarding
        setIsNewUser(true);
        setTimeout(() => {
          router.push("/onboarding");
        }, 3000); // Give them time to read the message
      } else {
        // Returning user - redirect to library
      setTimeout(() => {
        router.push("/library");
        }, 3000);
      }
    }
  }, [user, router]);

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-green-600 dark:text-green-400">Email Verified!</h1>
        <div className="space-y-3">
          <p className="text-gray-500 dark:text-gray-400">
            Your email address has been successfully verified. Your account is now active and ready to use.
          </p>
          
          {user ? (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                {isNewUser 
                  ? "Setting up your account..." 
                  : "You're all set! Redirecting you to your library..."
                }
              </p>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Please sign in to access your account and start reading.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {user ? (
            <Button asChild className="w-full">
              <Link href={isNewUser ? "/onboarding" : "/library"}>
                {isNewUser ? "Start Setup" : "Go to Library"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link href="/login">
                  Sign In Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/">Back to Home</Link>
              </Button>
            </>
          )}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-6">
          <p>
            Welcome to our reading platform! You can now save articles, take notes, and use AI assistance.
          </p>
        </div>
      </div>
    </div>
  );
} 