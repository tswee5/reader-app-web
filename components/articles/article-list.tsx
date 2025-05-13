import { ArticleCard } from "@/components/articles/article-card";

// Define Tag type
type Tag = {
  id: string;
  name: string;
  color: string;
};

interface ArticleListProps {
  articles: Array<{
    id: string;
    title: string;
    excerpt?: string | null;
    domain?: string | null;
    lead_image_url?: string | null;
    author?: string | null;
    created_at: string;
    estimated_read_time?: number | null;
    reading_progress?: number | null;
    is_completed?: boolean | null;
    tags?: Tag[]; // Add optional tags array
  }>;
  selectedTagId?: string; // Add an optional selected tag for filtering
}

export function ArticleList({ articles, selectedTagId }: ArticleListProps) {
  // Filter articles by selected tag if one is provided
  const filteredArticles = selectedTagId
    ? articles.filter(article => 
        article.tags?.some(tag => tag.id === selectedTagId)
      )
    : articles;

  if (filteredArticles.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold">No articles found</h2>
        <p className="mb-4 text-muted-foreground">
          {selectedTagId 
            ? "No articles with the selected tag"
            : "Add your first article to get started"
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredArticles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
} 