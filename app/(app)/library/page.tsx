import { AddArticleDialog } from "@/components/articles/add-article-dialog";
import { LibraryContent } from "@/components/articles/library-content";
import { LibrarySkeleton } from "@/components/articles/library-skeleton";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Suspense } from "react";

// This ensures the page is never cached and always fetches fresh data
export const revalidate = 0;

export default function LibraryPage() {
  return (
    <ProtectedRoute>
      <div className="container py-10 dashboard-section">
        <div className="dashboard-card mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="dashboard-header">Your Library</h1>
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