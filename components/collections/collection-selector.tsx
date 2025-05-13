"use client";

import { useEffect, useState } from "react";
import { Check, FolderPlus, FolderIcon } from "lucide-react";
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
import { CreateCollectionDialog } from "@/components/collections/create-collection-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Collection {
  id: string;
  name: string;
  description: string | null;
}

interface CollectionSelectorProps {
  articleId: string;
}

export function CollectionSelector({ articleId }: CollectionSelectorProps) {
  const { supabase, user } = useSupabase();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Fetch all collections for the user
  const fetchCollections = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data: allCollections, error } = await supabase
        .from("collections")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
        
      if (error) {
        console.error("Error fetching collections:", error);
        return;
      }
      
      setCollections(allCollections || []);
    } catch (err) {
      console.error("Unexpected error fetching collections:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch collections for the current article
  const fetchArticleCollections = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("collection_articles")
        .select("collection_id, collections(id, name, description)")
        .eq("article_id", articleId)
        .eq("user_id", user.id);
        
      if (error) {
        console.error("Error fetching article collections:", error);
        return;
      }
      
      const articleCollections = data
        .filter(item => item.collections)
        .map(item => ({
          id: item.collections.id,
          name: item.collections.name,
          description: item.collections.description
        }));
        
      setSelectedCollections(articleCollections);
    } catch (err) {
      console.error("Unexpected error fetching article collections:", err);
    }
  };

  // Load collections on component mount
  useEffect(() => {
    fetchCollections();
    fetchArticleCollections();
  }, [user, articleId]);

  // Add article to collection
  const addArticleToCollection = async (collection: Collection) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("collection_articles")
        .insert({
          article_id: articleId,
          collection_id: collection.id,
          user_id: user.id
        });
        
      if (error) {
        if (error.code === "23505") {
          // Article already in collection - silently ignore
          return;
        }
        
        toast({
          title: "Error adding to collection",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update selected collections
      setSelectedCollections(prev => [...prev, collection]);
      
      toast({
        title: "Added to collection",
        description: `Added to "${collection.name}"`,
      });
    } catch (err) {
      console.error("Error adding article to collection:", err);
    }
  };

  // Remove article from collection
  const removeArticleFromCollection = async (collectionId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("collection_articles")
        .delete()
        .eq("article_id", articleId)
        .eq("collection_id", collectionId)
        .eq("user_id", user.id);
        
      if (error) {
        toast({
          title: "Error removing from collection",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      // Update selected collections
      setSelectedCollections(prev => prev.filter(c => c.id !== collectionId));
      
      const collectionName = selectedCollections.find(c => c.id === collectionId)?.name;
      toast({
        title: "Removed from collection",
        description: `Removed from "${collectionName}"`,
      });
    } catch (err) {
      console.error("Error removing article from collection:", err);
    }
  };

  // Handle collection creation
  const handleCollectionCreated = async (collectionId: string) => {
    await fetchCollections();
    
    // Auto-select the newly created collection
    const { data: newCollection } = await supabase
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();
      
    if (newCollection) {
      addArticleToCollection(newCollection);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 justify-start border-dashed text-sm"
          >
            <FolderIcon className="mr-2 h-4 w-4" />
            {selectedCollections.length > 0 
              ? `In ${selectedCollections.length} collection${selectedCollections.length > 1 ? 's' : ''}` 
              : "Add to collection"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search collections..." />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">No collections found.</p>
                  <p className="mt-2">Create a new collection below.</p>
                </div>
              </CommandEmpty>
              <CommandGroup heading="Your Collections">
                <ScrollArea className="h-[200px]">
                  {collections.map((collection) => {
                    const isSelected = selectedCollections.some(c => c.id === collection.id);
                    
                    return (
                      <CommandItem
                        key={collection.id}
                        value={collection.name}
                        onSelect={() => {
                          if (isSelected) {
                            removeArticleFromCollection(collection.id);
                          } else {
                            addArticleToCollection(collection);
                          }
                        }}
                      >
                        <FolderIcon 
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className="flex-1">{collection.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>
              
              <CommandSeparator />
              
              <CommandGroup>
                <div className="p-2">
                  <CreateCollectionDialog 
                    onCollectionCreated={handleCollectionCreated}
                    triggerButton={
                      <Button variant="outline" size="sm" className="w-full">
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Create Collection
                      </Button>
                    }
                  />
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCollections.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedCollections.map((collection) => (
            <div
              key={collection.id}
              className="flex items-center gap-1 rounded-md bg-secondary/50 px-2 py-1 text-xs"
            >
              <FolderIcon className="h-3 w-3" />
              <span>{collection.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 