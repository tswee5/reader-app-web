import { ArticleDetail } from "@/components/articles/article-detail";
import { Suspense } from "react";
import { ArticleSkeleton } from "@/components/articles/article-skeleton";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ArticlePage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<ArticleSkeleton />}>
        <ArticleDetail articleId={params.id} />
      </Suspense>
    </ProtectedRoute>
  );
} 