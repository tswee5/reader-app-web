"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/ui/use-toast";
import { CreateTagDialog } from "@/components/articles/tags/create-tag-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}

export function TagSelector({ articleId }: TagSelectorProps) {
  const { supabase, user } = useSupabase();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Fetch all tags for the user
  const fetchTags = async () => {
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
  };

  // Fetch tags for the current article
  const fetchArticleTags = async () => {
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
  };

  // Load tags on component mount
  useEffect(() => {
    fetchTags();
    fetchArticleTags();
  }, [user, articleId]);

  // Add tag to article
  const addTagToArticle = async (tag: Tag) => {
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
    } catch (err) {
      console.error("Error adding tag to article:", err);
    }
  };

  // Remove tag from article
  const removeTagFromArticle = async (tagId: string) => {
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
    } catch (err) {
      console.error("Error removing tag from article:", err);
    }
  };

  // Handle tag creation
  const handleTagCreated = async (tagId: string) => {
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
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex space-x-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 justify-start border-dashed text-sm flex-1"
            >
              <TagIcon className="mr-2 h-4 w-4" />
              {selectedTags.length > 0 ? `${selectedTags.length} tags selected` : "Add tags"}
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[300px] p-0 z-[9999] shadow-lg border-2 bg-background" 
            align="start"
            sideOffset={5}
          >
            <Command className="border-none rounded-none">
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>
                  <div className="py-6 text-center text-sm">
                    <p className="text-muted-foreground">No tags found.</p>
                    <p className="mt-2">Create a new tag below.</p>
                  </div>
                </CommandEmpty>
                <CommandGroup heading="Your Tags">
                  <ScrollArea className="h-[200px]">
                    {tags.map((tag) => {
                      const isSelected = selectedTags.some(t => t.id === tag.id);
                      
                      return (
                        <CommandItem
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => {
                            if (isSelected) {
                              removeTagFromArticle(tag.id);
                            } else {
                              addTagToArticle(tag);
                            }
                          }}
                        >
                          <div 
                            className={cn(
                              "mr-2 h-4 w-4 rounded-full",
                              getTagColorClass(tag.color)
                            )}
                          />
                          <span className="flex-1">{tag.name}</span>
                          {isSelected && <Check className="h-4 w-4" />}
                        </CommandItem>
                      );
                    })}
                  </ScrollArea>
                </CommandGroup>
                
                <CommandSeparator />
                
                <CommandGroup>
                  <div className="p-2 bg-background">
                    <CreateTagDialog 
                      onTagCreated={handleTagCreated}
                      triggerButton={
                        <Button variant="outline" size="sm" className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Create Tag
                        </Button>
                      }
                    />
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <CreateTagDialog 
          onTagCreated={handleTagCreated}
          triggerButton={
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 border-dashed"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="sr-only md:not-sr-only md:inline">New Tag</span>
            </Button>
          }
        />
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className={cn(
                "flex items-center gap-1 rounded-full px-3 py-1 text-xs",
                getTagColorClass(tag.color)
              )}
            >
              <span>{tag.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto w-auto p-0"
                onClick={() => removeTagFromArticle(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 