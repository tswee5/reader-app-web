import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/ui/use-toast";
import { MoreVertical, Trash2, Tag as TagIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArticleTagManager } from "@/components/articles/tags/article-tag-manager";

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
  onDeleteSuccess?: () => void; // Add callback to refresh the library after deletion
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

export function ArticleCard({ article, onDeleteSuccess }: ArticleCardProps) {
  const router = useRouter();
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const createdAt = new Date(article.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });
  
  // Calculate progress percentage
  const progress = article.reading_progress || 0;
  const progressPercentage = Math.min(Math.round(progress * 100), 100);

  // Use proxied image if available
  const imageUrl = article.lead_image_url 
    ? `/api/proxy?url=${encodeURIComponent(article.lead_image_url)}`
    : null;

  // Handle delete article
  const handleDeleteArticle = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // First, delete all associated highlights
      const { error: highlightsError } = await supabase
        .from("highlights")
        .delete()
        .eq("article_id", article.id)
        .eq("user_id", user.id);
        
      if (highlightsError) {
        console.error("Error deleting highlights:", highlightsError);
        toast({
          title: "Error",
          description: "Failed to delete article highlights.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Delete all associated notes
      const { error: notesError } = await supabase
        .from("notes")
        .delete()
        .eq("article_id", article.id)
        .eq("user_id", user.id);
        
      if (notesError) {
        console.error("Error deleting notes:", notesError);
        toast({
          title: "Error",
          description: "Failed to delete article notes.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Delete article tags
      const { error: tagsError } = await supabase
        .from("article_tags")
        .delete()
        .eq("article_id", article.id)
        .eq("user_id", user.id);
        
      if (tagsError) {
        console.error("Error deleting article tags:", tagsError);
        // Continue with deletion even if tags fail
      }
      
      // Finally delete the article itself
      const { error: articleError } = await supabase
        .from("articles")
        .delete()
        .eq("id", article.id)
        .eq("user_id", user.id);
        
      if (articleError) {
        console.error("Error deleting article:", articleError);
        toast({
          title: "Error",
          description: "Failed to delete article.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      toast({
        title: "Article deleted",
        description: "The article has been removed from your library.",
      });
      
      // Call onDeleteSuccess to refresh the library
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err) {
      console.error("Unexpected error deleting article:", err);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Prevents event propagation when clicking dropdown menu
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  // Handle navigation to article
  const handleCardClick = () => {
    router.push(`/articles/${article.id}`);
  };

  // Handle tag management
  const handleTagsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(false); // Close the dropdown
    setShowTagDialog(true);
  };

  // Handle tag dialog close and refresh
  const handleTagDialogClose = () => {
    setShowTagDialog(false);
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden dashboard-card transition-all hover:shadow-lg hover:-translate-y-1">
      <div onClick={handleCardClick} className="cursor-pointer">
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
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex justify-between items-start">
          <h3 onClick={handleCardClick} className="cursor-pointer line-clamp-2 text-xl font-semibold pr-6 text-foreground">{article.title}</h3>
          <div onClick={handleMenuClick}>
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-50 group-hover:opacity-100"
                  title="Article options"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-900 bg-opacity-100 z-[100] shadow-lg">
                <DropdownMenuItem 
                  onClick={handleTagsClick}
                  className="cursor-pointer"
                >
                  <TagIcon className="mr-2 h-4 w-4" />
                  <span>Manage Tags</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowDeleteDialog(true);
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete article</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div onClick={handleCardClick} className="cursor-pointer">
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
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{article.title}&quot; from your library, including all highlights and notes.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteArticle}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tag management dialog */}
      <Dialog open={showTagDialog} onOpenChange={(open) => {
        setShowTagDialog(open);
        // If dialog is being closed, refresh the library
        if (!open && onDeleteSuccess) {
          onDeleteSuccess();
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogDescription>
              Add or remove tags for &quot;{article.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 overflow-hidden">
            <ArticleTagManager 
              articleId={article.id} 
              onTagsChanged={handleTagDialogClose}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 