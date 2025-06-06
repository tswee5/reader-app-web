"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, Plus, Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/ui/use-toast";
import { CreateTagDialog } from "@/components/articles/tags/create-tag-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

interface TagSelectorProps {
  articleId: string;
  onTagsChanged?: () => void;
}

export function TagSelector({ articleId, onTagsChanged }: TagSelectorProps) {
  const { supabase, user } = useSupabase();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

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
      setSelectedTags(prev => [...prev, tag]);
      
      toast({
        title: "Tag added",
        description: `Added "${tag.name}" to this article`,
      });
      
      if (onTagsChanged) {
        onTagsChanged();
      }
    } catch (err) {
      console.error("Error adding tag to article:", err);
    }
  }, [user, supabase, articleId, toast, onTagsChanged]);

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
      setSelectedTags(prev => prev.filter(tag => tag.id !== tagId));
      
      const tagName = selectedTags.find(tag => tag.id === tagId)?.name;
      toast({
        title: "Tag removed",
        description: `Removed "${tagName}" from this article`,
      });
      
      if (onTagsChanged) {
        onTagsChanged();
      }
    } catch (err) {
      console.error("Error removing tag from article:", err);
    }
  }, [user, supabase, articleId, selectedTags, toast, onTagsChanged]);

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
    setOpen(false);
  }, [selectedTags, removeTagFromArticle, addTagToArticle]);

  // Handle create new tag
  const handleCreateNewTagClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setOpen(false);
    setShowCreateDialog(true);
  }, []);

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
    } catch (err) {
      console.error("Error deleting tag:", err);
    }
  }, [user, supabase, toast, onTagsChanged]);

  // Filter tags based on search query
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Display existing tags */}
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
            onClick={(e) => removeTagFromArticle(tag.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      {/* Add Tag Button */}
      <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          setSearchQuery(""); // Reset search when opening
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 px-2 rounded-full text-xs"
          >
            <Plus className="h-3 w-3 mr-1" /> New Tag
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[250px] p-0 z-[200] shadow-lg border bg-white dark:bg-gray-900" 
          align="start"
          sideOffset={5}
        >
          <div className="flex flex-col h-[360px]">
            {/* Search Input */}
            <div className="p-3 border-b flex-shrink-0">
              <Input placeholder="Search tags..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            
            {/* Tags List - Scrollable */}
            <div className="flex-1 min-h-0 relative">
              <div className="px-2 py-1 flex-shrink-0">
                <h3 className="text-xs font-medium text-muted-foreground px-2 py-1.5">Your Tags</h3>
              </div>
              <div className="absolute inset-x-0 top-[40px] bottom-[1px]">
                <ScrollArea className="h-full" type="always">
                  <div className="px-3 pb-2">
                    {filteredTags.length > 0 ? (
                      <div className="space-y-1">
                        {filteredTags.map((tag) => {
                          const isSelected = selectedTags.some(t => t.id === tag.id);
                          return (
                            <div
                              key={tag.id}
                              className="flex items-center py-1.5 px-2 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm group"
                              onClick={(e) => handleTagClick(e, tag)}
                            >
                              <div className={`h-3 w-3 rounded-full ${getTagColorClass(tag.color)} mr-2 flex-shrink-0`} />
                              <span className="flex-1 truncate">{tag.name}</span>
                              <div className="flex items-center ml-2 gap-1">
                                {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
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
                      <div className="text-center text-muted-foreground py-8 text-sm">
                        {searchQuery ? `No tags found matching "${searchQuery}"` : "No tags available"}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
            
            {/* Create New Tag Button - Always Visible at Bottom */}
            <div className="relative border-t bg-background/95 backdrop-blur-sm shadow-sm flex-shrink-0 z-10">
              <div className="p-3 bg-background">
                <div
                  className="flex items-center py-2 px-3 cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-md border border-dashed border-muted-foreground/30 hover:border-accent-foreground/50 transition-colors"
                  onClick={handleCreateNewTagClick}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="font-medium">Create a new tag</span>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Create Tag Dialog */}
      <CreateTagDialog 
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onTagCreated={handleTagCreated}
      />
    </div>
  );
} 