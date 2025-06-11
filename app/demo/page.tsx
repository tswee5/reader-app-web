"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GuestArticleDetail } from "@/components/articles/guest-article-detail";
import { DemoLimitationsProvider } from "@/components/articles/demo-limitations-provider";
import Link from "next/link";
import { ArrowLeft, User, BookOpen } from "lucide-react";

type GuestArticle = {
  id: string;
  url: string;
  title: string;
  author?: string | null;
  published_date?: string | null;
  content: string;
  excerpt?: string | null;
  lead_image_url?: string | null;
  domain: string;
  word_count: number;
  estimated_read_time: number;
  reading_progress: number;
  is_completed: boolean;
  created_at: string;
  user_id: null;
  is_demo: true;
};

function DemoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [article, setArticle] = useState<GuestArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const url = searchParams.get('url');

  useEffect(() => {
    const parseArticle = async () => {
      if (!url) {
        setError("No URL provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/demo/parse-article", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: decodeURIComponent(url) }),
        });

        const result = await response.json();

        if (!response.ok) {
          setError(result.details || result.error || "Failed to parse article");
          return;
        }

        setArticle(result.article);
      } catch (err) {
        console.error("Error parsing article:", err);
        setError("An unexpected error occurred while parsing the article");
      } finally {
        setIsLoading(false);
      }
    };

    parseArticle();
  }, [url]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Demo Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border-b">
          <div className="container py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">You're in demo mode</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Parsing your article...</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/signup">
                    <User className="h-4 w-4 mr-2" />
                    Sign Up Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Parsing your article...</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a few moments</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Demo Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border-b">
          <div className="container py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">You're in demo mode</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Unable to parse article</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/signup">
                    <User className="h-4 w-4 mr-2" />
                    Sign Up Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="container max-w-4xl py-10">
          <div className="rounded-lg border p-8 text-center">
            <h2 className="mb-2 text-xl font-semibold">Unable to Parse Article</h2>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push('/')}>
                Try Another Article
              </Button>
              <Button asChild>
                <Link href="/signup">Sign Up for Full Access</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        {/* Demo Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border-b">
          <div className="container py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">You're in demo mode</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">No article found</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                  <Link href="/signup">
                    <User className="h-4 w-4 mr-2" />
                    Sign Up Free
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* No Article State */}
        <div className="container max-w-4xl py-10">
          <div className="rounded-lg border p-8 text-center">
            <h2 className="mb-2 text-xl font-semibold">No Article Found</h2>
            <p className="mb-4 text-muted-foreground">The article could not be loaded</p>
            <Button onClick={() => router.push('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border-b">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">You're in demo mode</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Sign up to save articles, take notes, and track your reading progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" asChild>
                <Link href="/signup">
                  <User className="h-4 w-4 mr-2" />
                  Sign Up Free
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <DemoLimitationsProvider>
        <GuestArticleDetail article={article} />
      </DemoLimitationsProvider>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading demo...</p>
        </div>
      </div>
    }>
      <DemoContent />
    </Suspense>
  );
} 