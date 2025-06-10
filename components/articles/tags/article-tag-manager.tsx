"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/ui/use-toast";
import { CreateTagDialog } from "@/components/articles/tags/create-tag-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Helper function to get color classes for tags
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

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ArticleTagManagerProps {
  articleId: string;
  onTagsChanged?: () => void;
  onTagsUpdated?: (articleId: string, updatedTags: Tag[]) => void;
  currentTags?: Tag[];
  onClose?: () => void;
}

export function ArticleTagManager({ articleId, onTagsChanged, onTagsUpdated, currentTags = [], onClose }: ArticleTagManagerProps) {
  const { supabase, user } = useSupabase();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(currentTags);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Update selectedTags when currentTags prop changes
  useEffect(() => {
    setSelectedTags(currentTags);
  }, [currentTags]);

  // Fetch all tags for the user
  const fetchTags = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data: allTags, error } = await supabase
        .from("tags")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
        
      if (error) {
        console.error("Error fetching tags:", error);
        return;
      }
      
      setTags(allTags || []);
    } catch (err) {
      console.error("Unexpected error fetching tags:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Fetch tags for the current article
  const fetchArticleTags = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("article_tags")
        .select("tag_id, tags(id, name, color)")
        .eq("article_id", articleId)
        .eq("user_id", user.id);
        
      if (error) {
        console.error("Error fetching article tags:", error);
        return;
      }
      
      const articleTags = data
        .filter(item => item.tags)
        .map(item => ({
          id: item.tags.id,
          name: item.tags.name,
          color: item.tags.color
        }));
        
      setSelectedTags(articleTags);
    } catch (err) {
      console.error("Unexpected error fetching article tags:", err);
    }
  }, [user, supabase, articleId]);

  // Load tags on component mount
  useEffect(() => {
    fetchTags();
    fetchArticleTags();
  }, [fetchTags, fetchArticleTags]);

  // Add tag to article
  const addTagToArticle = useCallback(async (tag: Tag) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("article_tags")
        .insert({
          article_id: articleId,
          tag_id: tag.id,
          user_id: user.id
        });
        
      if (error) {
        if (error.code === "23505") {
          // Tag already attached to article - silently ignore
          return;
        }
        
        toast({
          title: "Error adding tag",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update selected tags
      const newSelectedTags = [...selectedTags, tag];
      setSelectedTags(newSelectedTags);
      
      toast({
        title: "Tag added",
        description: `Added "${tag.name}" to this article`,
      });
      
      // Call both callbacks
      if (onTagsChanged) {
        onTagsChanged();
      }
      
      if (onTagsUpdated) {
        onTagsUpdated(articleId, newSelectedTags);
      }
    } catch (err) {
      console.error("Error adding tag to article:", err);
    }
  }, [user, supabase, articleId, selectedTags, toast, onTagsChanged, onTagsUpdated]);

  // Remove tag from article
  const removeTagFromArticle = useCallback(async (tagId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("article_tags")
        .delete()
        .eq("article_id", articleId)
        .eq("tag_id", tagId)
        .eq("user_id", user.id);
        
      if (error) {
        toast({
          title: "Error removing tag",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update selected tags
      const newSelectedTags = selectedTags.filter(tag => tag.id !== tagId);
      setSelectedTags(newSelectedTags);
      
      const tagName = selectedTags.find(tag => tag.id === tagId)?.name;
      toast({
        title: "Tag removed",
        description: `Removed "${tagName}" from this article`,
      });
      
      // Call both callbacks
      if (onTagsChanged) {
        onTagsChanged();
      }
      
      if (onTagsUpdated) {
        onTagsUpdated(articleId, newSelectedTags);
      }
    } catch (err) {
      console.error("Error removing tag from article:", err);
    }
  }, [user, supabase, articleId, selectedTags, toast, onTagsChanged, onTagsUpdated]);

  // Handle tag creation
  const handleTagCreated = useCallback(async (tagId: string) => {
    await fetchTags();
    
    // Auto-select the newly created tag
    const { data: newTag } = await supabase
      .from("tags")
      .select("*")
      .eq("id", tagId)
      .single();
      
    if (newTag) {
      addTagToArticle(newTag);
    }
  }, [fetchTags, supabase, addTagToArticle]);

  // Handle tag selection
  const handleTagClick = useCallback((e: React.MouseEvent, tag: Tag) => {
    e.preventDefault();
    e.stopPropagation();
    
    const isSelected = selectedTags.some(t => t.id === tag.id);
    
    if (isSelected) {
      removeTagFromArticle(tag.id);
    } else {
      addTagToArticle(tag);
    }
    
    // Close the dialog after tag selection
    if (onClose) {
      // Add a small delay to allow the user to see the tag change
      setTimeout(() => {
        onClose();
      }, 300);
    }
  }, [selectedTags, removeTagFromArticle, addTagToArticle, onClose]);

  // Delete tag entirely from user's collection
  const deleteTag = useCallback(async (e: React.MouseEvent, tag: Tag) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) return;
    
    try {
      // First remove all article associations
      await supabase
        .from("article_tags")
        .delete()
        .eq("tag_id", tag.id)
        .eq("user_id", user.id);
      
      // Then delete the tag itself
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tag.id)
        .eq("user_id", user.id);
        
      if (error) {
        toast({
          title: "Error deleting tag",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update state
      setTags(prev => prev.filter(t => t.id !== tag.id));
      setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
      
      toast({
        title: "Tag deleted",
        description: `Deleted "${tag.name}" from your collection`,
      });
      
      if (onTagsChanged) {
        onTagsChanged();
      }
      
      if (onTagsUpdated) {
        onTagsUpdated(articleId, selectedTags.filter(t => t.id !== tag.id));
      }
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  }, [user, supabase, toast, onTagsChanged, onTagsUpdated, articleId, selectedTags]);

  // Filter tags based on search query
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Display existing tags */}
      {selectedTags.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Selected Tags</h4>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <Badge 
                key={tag.id} 
                className={`${getTagColorClass(tag.color)} text-foreground`}
              >
                {tag.name}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 ml-1 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeTagFromArticle(tag.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* New Tag Button */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Available Tags</h4>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 rounded-full text-xs"
          onClick={() => setShowCreateDialog(true)}
        >
          <Plus className="h-3 w-3 mr-1" /> New Tag
        </Button>
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <Input 
          placeholder="Search tags..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9"
        />
      </div>
      
      {/* Tags List */}
      <div className="space-y-2">
        <ScrollArea className="h-[320px] w-full rounded-md border p-2">
          {filteredTags.length > 0 ? (
            <div className="space-y-1 pr-3">
              {filteredTags.map((tag) => {
                const isSelected = selectedTags.some(t => t.id === tag.id);
                return (
                  <div
                    key={tag.id}
                    className="flex items-center py-2 px-3 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm border transition-colors group"
                    onClick={(e) => handleTagClick(e, tag)}
                  >
                    <div className={`h-3 w-3 rounded-full ${getTagColorClass(tag.color)} mr-3 flex-shrink-0`} />
                    <span className="flex-1 truncate">{tag.name}</span>
                    <div className="flex items-center ml-2 gap-2">
                      {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => deleteTag(e, tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12 text-sm">
              {searchQuery ? `No tags found matching "${searchQuery}"` : "No tags available"}
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Create Tag Dialog */}
      <CreateTagDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTagCreated={handleTagCreated}
      />
    </div>
  );
} 