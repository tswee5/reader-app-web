"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";

export default function Home() {
  const [demoUrl, setDemoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useSupabase();

  // Redirect authenticated users to library
  useEffect(() => {
    if (user) {
      router.push("/library");
    }
  }, [user, router]);

  // Handle demo article submission
  const handleStartLearning = async () => {
    if (!demoUrl.trim()) return;
    
    setIsLoading(true);
    try {
      // For demo purposes, we'll redirect to a demo article or use the URL provided
      // In a real implementation, this might parse the article and create a temporary demo
      const encodedUrl = encodeURIComponent(demoUrl);
      router.push(`/demo?url=${encodedUrl}`);
    } catch (error) {
      console.error("Error starting demo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render the landing page if user is authenticated (they'll be redirected)
  if (user) {
    return null;
  }

  return (
    <div className="container flex flex-col items-center justify-center py-20 text-center dashboard-section">
      <div className="dashboard-card max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl text-foreground">
          Actually remember what you read
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground mx-auto">
          Track, engage with, and retain what you read so that you can get the most from your curiosity
        </p>
        
        {/* Demo URL Input and Start Learning Button */}
        <div className="mt-8 max-w-md mx-auto">
          <div className="flex flex-col gap-3">
            <Input
              type="url"
              placeholder="Paste any article URL to try it out..."
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              className="text-center"
            />
            <Button
              size="lg"
              className="btn-emerald"
              onClick={handleStartLearning}
              disabled={!demoUrl.trim() || isLoading}
            >
              {isLoading ? "Loading..." : "Start Learning"}
            </Button>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button size="lg" className="btn-emerald" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-xl" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
      <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="dashboard-card flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-emerald-100 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-emerald-600"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Track</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Track all of the articles you've read, and want to read in one place.
          </p>
        </div>
        <div className="dashboard-card flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-amber-100 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-amber-600"
            >
              <path d="m3 17 2 2 4-4" />
              <path d="m3 7 2 2 4-4" />
              <path d="M13 6h8" />
              <path d="M13 12h8" />
              <path d="M13 18h8" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Learn</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Use AI to ask engage with the content as you're reading.
          </p>
        </div>
        <div className="dashboard-card flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-emerald-100 p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-emerald-600"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-foreground">Remember</h2>
          <p className="mt-2 text-center text-muted-foreground">
            Use science-backed methods to remember what you read.
          </p>
        </div>
      </div>
    </div>
  );
}
