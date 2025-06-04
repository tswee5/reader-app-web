"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { ArticleList } from "@/components/articles/article-list";
import { Database } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, Tag as TagIcon, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Define Tag type
type Tag = {
  id: string;
  name: string;
  color: string;
};

// Define the article type
type Article = {
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
  user_id: string;
  url: string;
  content: string;
  tags?: Tag[]; // Add tags
};

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

export function LibraryContent() {
  const { user, supabase } = useSupabase();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Create direct admin client if needed - this will bypass RLS
  // Memoize this function
  const adminFetch = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/debug?userId=${userId}`);
      const data = await response.json();
      
      if (data.articlesCount > 0) {
        // Use our debug endpoint to fetch articles directly
        return data.articles;
      }
      return [];
    } catch (err) {
      console.error("Error fetching with admin:", err);
      return [];
    }
  }, []);

  // Update the fetchTags function to use the authenticated client from provider
  const fetchTags = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
        
      if (error) {
        console.error("Error fetching tags:", error);
        return;
      }
      
      setTags(data || []);
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  }, [user, supabase]);

  // Update the fetchArticleTags function to use the authenticated client from provider
  const fetchArticleTags = useCallback(async (articleId: string) => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from("article_tags")
        .select("tag_id, tags(id, name, color)")
        .eq("article_id", articleId)
        .eq("user_id", user.id);
        
      if (error) {
        console.error("Error fetching article tags:", error);
        return [];
      }
      
      return data
        .filter(item => item.tags)
        .map(item => ({
          id: item.tags.id,
          name: item.tags.name,
          color: item.tags.color
        }));
    } catch (err) {
      console.error("Error fetching article tags:", err);
      return [];
    }
  }, [user, supabase]);

  // Update the Fetch articles effect to use the authenticated client from provider
  useEffect(() => {
    const fetchArticles = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        console.log("Fetching articles for user:", user.id);
        
        // Use the authenticated client from provider
        const { data: fetchedArticles, error } = await supabase
          .from("articles")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching articles with client:", error);
          console.error("Error details:", error.message, error.details);
          
          // Add more debugging information
          console.log("Attempting to fetch with admin API as fallback");
          // Fall back to admin fetching as needed
          const adminArticles = await adminFetch(user.id);
          if (adminArticles.length > 0) {
            console.log("Successfully fetched articles with admin API:", adminArticles.length);
            setArticles(adminArticles);
          } else {
            setError("Failed to fetch articles");
          }
        } else {
          console.log("Articles fetched successfully, count:", fetchedArticles?.length || 0);
          
          // For each article, fetch its tags
          const articlesWithTags = await Promise.all(
            (fetchedArticles || []).map(async (article) => {
              const tags = await fetchArticleTags(article.id);
              return { ...article, tags };
            })
          );
          
          setArticles(articlesWithTags);
          console.log("Successfully fetched", articlesWithTags.length, "articles with tags");
        }
        
        // Fetch available tags
        await fetchTags();
      } catch (err) {
        console.error("Error in article fetching:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    // Add a delay before fetching to ensure auth is established
    const timeoutId = setTimeout(() => fetchArticles(), 500); // Increase delay to 500ms
    return () => clearTimeout(timeoutId);
  }, [user, adminFetch, supabase, fetchArticleTags, fetchTags]);

  // Clear the selected tag
  const clearTagFilter = () => {
    setSelectedTagId(null);
  };

  // Get the selected tag details
  const selectedTag = selectedTagId ? tags.find(tag => tag.id === selectedTagId) : null;

  // Add a refresh function that re-fetches articles and tags
  const refreshLibrary = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log("Refreshing library...");
      
      // Fetch articles
      const { data: fetchedArticles, error } = await supabase
        .from("articles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error refreshing articles:", error);
        
        // Fall back to admin fetching
        const adminArticles = await adminFetch(user.id);
        if (adminArticles.length > 0) {
          setArticles(adminArticles);
        } else {
          setError("Failed to refresh articles");
        }
      } else {
        // For each article, fetch its tags
        const articlesWithTags = await Promise.all(
          (fetchedArticles || []).map(async (article) => {
            const tags = await fetchArticleTags(article.id);
            return { ...article, tags };
          })
        );
        
        setArticles(articlesWithTags);
      }
      
      // Refresh tags
      await fetchTags();
    } catch (err) {
      console.error("Error in library refresh:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase, adminFetch, fetchArticleTags, fetchTags]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        <p className="ml-2">Loading your articles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-destructive">Error</h2>
        <p className="mb-4 text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold">Authentication Required</h2>
        <p className="mb-4 text-muted-foreground">
          Please log in to view your library
        </p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold">No articles yet</h2>
        <p className="mb-4 text-muted-foreground">
          Add your first article to get started
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Tags filter */}
      {tags.length > 0 && (
        <div className="dashboard-input-container mb-6">
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 rounded-xl">
                  <TagIcon className="mr-2 h-4 w-4" />
                  {selectedTag ? 'Filtered by tag' : 'Filter by tag'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white dark:bg-gray-900 bg-opacity-100 z-[100] shadow-lg">
                <DropdownMenuGroup>
                  {tags.map((tag) => (
                    <DropdownMenuItem 
                      key={tag.id}
                      onClick={() => setSelectedTagId(tag.id)}
                    >
                      <div 
                        className={cn(
                          "mr-2 h-3 w-3 rounded-full",
                          getTagColorClass(tag.color)
                        )}
                      />
                      <span className="flex-1">{tag.name}</span>
                      {selectedTagId === tag.id && (
                        <Check className="h-4 w-4 ml-2" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                {tags.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onClick={clearTagFilter}
                  disabled={!selectedTagId}
                  className="text-muted-foreground"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear filter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {selectedTag && (
              <Badge 
                className={cn(
                  "flex items-center gap-1 px-3 py-1",
                  getTagColorClass(selectedTag.color)
                )}
              >
                {selectedTag.name}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearTagFilter}
                  className="h-auto w-auto p-0"
                >
                  <X className="h-3 w-3 ml-1" />
                  <span className="sr-only">Clear</span>
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}

      <ArticleList 
        articles={articles} 
        selectedTagId={selectedTagId || undefined} 
        onRefresh={refreshLibrary} 
      />
    </>
  );
} 