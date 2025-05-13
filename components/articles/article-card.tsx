import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Add the Tag type
type Tag = {
  id: string;
  name: string;
  color: string;
};

// Update the ArticleCardProps to include tags
interface ArticleCardProps {
  article: {
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
  };
}

// Helper function to get tag color classes
function getTagColorClass(color: string): string {
  switch (color) {
    case "gray": return "bg-gray-200 dark:bg-gray-700";
    case "red": return "bg-red-200 dark:bg-red-700";
    case "orange": return "bg-orange-200 dark:bg-orange-700";
    case "amber": return "bg-amber-200 dark:bg-amber-700";
    case "yellow": return "bg-yellow-200 dark:bg-yellow-700";
    case "lime": return "bg-lime-200 dark:bg-lime-700";
    case "green": return "bg-green-200 dark:bg-green-700";
    case "emerald": return "bg-emerald-200 dark:bg-emerald-700";
    case "teal": return "bg-teal-200 dark:bg-teal-700";
    case "cyan": return "bg-cyan-200 dark:bg-cyan-700";
    case "sky": return "bg-sky-200 dark:bg-sky-700";
    case "blue": return "bg-blue-200 dark:bg-blue-700";
    case "indigo": return "bg-indigo-200 dark:bg-indigo-700";
    case "violet": return "bg-violet-200 dark:bg-violet-700";
    case "purple": return "bg-purple-200 dark:bg-purple-700";
    case "fuchsia": return "bg-fuchsia-200 dark:bg-fuchsia-700";
    case "pink": return "bg-pink-200 dark:bg-pink-700";
    case "rose": return "bg-rose-200 dark:bg-rose-700";
    default: return "bg-gray-200 dark:bg-gray-700";
  }
}

export function ArticleCard({ article }: ArticleCardProps) {
  const createdAt = new Date(article.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
  
  // Calculate progress percentage
  const progress = article.reading_progress || 0;
  const progressPercentage = Math.min(Math.round(progress * 100), 100);

  // Use proxied image if available
  const imageUrl = article.lead_image_url 
    ? `/api/proxy?url=${encodeURIComponent(article.lead_image_url)}`
    : null;

  return (
    <Link href={`/articles/${article.id}`} prefetch={true}>
      <div className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md">
        {imageUrl && (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={article.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="line-clamp-2 text-xl font-semibold">{article.title}</h3>
          {article.excerpt && (
            <p className="mt-2 line-clamp-2 text-muted-foreground">
              {article.excerpt}
            </p>
          )}
          
          {/* Add tags display */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {article.tags.slice(0, 3).map((tag) => (
                <div
                  key={tag.id}
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    getTagColorClass(tag.color)
                  )}
                >
                  {tag.name}
                </div>
              ))}
              {article.tags.length > 3 && (
                <div className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                  +{article.tags.length - 3} more
                </div>
              )}
            </div>
          )}
          
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                {article.domain && (
                  <span className="rounded-full bg-secondary px-2 py-1 text-xs">
                    {article.domain}
                  </span>
                )}
                {article.author && <span>by {article.author}</span>}
              </div>
              <span>{timeAgo}</span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              {article.estimated_read_time && (
                <span className="text-sm text-muted-foreground">
                  {article.estimated_read_time} min read
                </span>
              )}
              {article.is_completed ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-800/30 dark:text-green-500">
                  Completed
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {progressPercentage}% read
                </span>
              )}
            </div>
            {!article.is_completed && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 