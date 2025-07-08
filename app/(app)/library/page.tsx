import { AddArticleDialog } from "@/components/articles/add-article-dialog";
import { LibraryContent } from "@/components/articles/library-content";
import { LibrarySkeleton } from "@/components/articles/library-skeleton";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Suspense } from "react";
import { ArticleCount } from "@/components/articles/article-count";

// This ensures the page is never cached and always fetches fresh data
export const revalidate = 0;

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <div className="container py-10 dashboard-section">
        <div className="dashboard-card mb-6">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <h1 className="dashboard-header">Your Library</h1>
              <Suspense fallback={<div className="flex items-center gap-2"><div className="h-6 w-8 animate-pulse bg-muted rounded" /><div className="h-6 w-6 animate-pulse bg-muted rounded" /></div>}>
                <ArticleCount />
              </Suspense>
            </div>
            <AddArticleDialog />
          </div>
          <p className="text-muted-foreground">
            Organize and read your saved articles
          </p>
        </div>
        
        <Suspense fallback={<LibrarySkeleton />}>
          <LibraryContent />
        </Suspense>
      </div>
    </ProtectedRoute>
  );
} 