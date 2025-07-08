"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Clock } from "lucide-react";

interface ArticleStats {
  total: number;
  completed: number;
  totalReadingTime: number;
}

export function ArticleCount() {
  const { user, supabase } = useSupabase();
  const [stats, setStats] = useState<ArticleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticleStats = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch articles with stats
        const { data: articles, error } = await supabase
          .from("articles")
          .select("is_completed, estimated_read_time")
          .eq("user_id", user.id);

        if (error) {
          console.error("Error fetching article stats:", error);
          // Fallback to admin API if needed
          try {
            const response = await fetch(`/api/debug?userId=${user.id}`);
            const data = await response.json();
            setStats({
              total: data.articlesCount || 0,
              completed: 0,
              totalReadingTime: 0
            });
          } catch (fallbackError) {
            console.error("Fallback stats fetch failed:", fallbackError);
            setStats({ total: 0, completed: 0, totalReadingTime: 0 });
          }
        } else {
          const total = articles?.length || 0;
          const completed = articles?.filter(article => article.is_completed).length || 0;
          const totalReadingTime = articles?.reduce((sum, article) => 
            sum + (article.estimated_read_time || 0), 0) || 0;

          setStats({ total, completed, totalReadingTime });
        }
      } catch (err) {
        console.error("Error in article stats fetch:", err);
        setStats({ total: 0, completed: 0, totalReadingTime: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure auth is established
    const timeoutId = setTimeout(() => fetchArticleStats(), 300);
    return () => clearTimeout(timeoutId);
  }, [user, supabase]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-6 w-8 animate-pulse bg-muted rounded" />
        <div className="h-6 w-6 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Total articles badge */}
      <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
        <BookOpen className="h-3 w-3" />
        <span className="text-xs font-medium">
          {stats.total} {stats.total === 1 ? 'article' : 'articles'}
        </span>
      </Badge>

      {/* Completed articles badge (only show if there are completed articles) */}
      {stats.completed > 0 && (
        <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span className="text-xs font-medium text-green-600">
            {stats.completed} completed
          </span>
        </Badge>
      )}

      {/* Total reading time badge (only show if there's reading time) */}
      {stats.totalReadingTime > 0 && (
        <Badge variant="outline" className="flex items-center gap-1 px-2 py-1">
          <Clock className="h-3 w-3 text-blue-600" />
          <span className="text-xs font-medium text-blue-600">
            {formatReadingTime(stats.totalReadingTime)}
          </span>
        </Badge>
      )}
    </div>
  );
} 