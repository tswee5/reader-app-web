"use client";

import { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { MessageSquare, Trash2, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
  highlight_id: string | null;
  highlight?: {
    content: string;
    color: string;
  };
}

interface NoteListProps {
  articleId: string;
  onClose?: () => void;
}

export function NoteList({ articleId, onClose }: NoteListProps) {
  const { supabase, user } = useSupabase();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load notes for the article
  const loadNotes = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("notes")
        .select(`
          *,
          highlight:highlight_id (
            content,
            color
          )
        `)
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading notes:", error);
        return;
      }

      setNotes(data || []);
    } catch (err) {
      console.error("Unexpected error loading notes:", err);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, supabase, user]);

  // Delete a note
  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", noteId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting note:", error);
        toast({
          title: "Error deleting note",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Update notes list
      setNotes((prev) => prev.filter((note) => note.id !== noteId));

      toast({
        title: "Note deleted",
        description: "Your note has been deleted",
      });
    } catch (err) {
      console.error("Error deleting note:", err);
    }
  };

  // Scroll to highlight when clicking on the highlight text
  const scrollToHighlight = (highlightId: string) => {
    const highlightElement = document.querySelector(
      `[data-highlight-id="${highlightId}"]`
    );
    
    if (highlightElement) {
      highlightElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      
      // Add a temporary highlight effect
      highlightElement.classList.add("ring-2", "ring-primary", "ring-offset-2");
      setTimeout(() => {
        highlightElement.classList.remove("ring-2", "ring-primary", "ring-offset-2");
      }, 2000);
    }
  };

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  return (
    <div className="flex h-full flex-col rounded-lg border bg-background p-4 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Notes</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="ml-2">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center space-y-2 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
          <h4 className="text-lg font-medium">No notes yet</h4>
          <p className="text-sm text-muted-foreground">
            Highlight text and click the note icon to add notes.
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg border bg-card p-4 shadow-sm"
              >
                {note.highlight && (
                  <div 
                    className="mb-2 cursor-pointer rounded border-l-4 bg-muted/50 p-2 text-sm italic"
                    style={{ 
                      borderLeftColor: note.highlight.color === 'yellow' 
                        ? '#fef08a' 
                        : note.highlight.color === 'green'
                        ? '#bbf7d0'
                        : note.highlight.color === 'blue'
                        ? '#bfdbfe'
                        : note.highlight.color === 'purple'
                        ? '#e9d5ff'
                        : note.highlight.color === 'pink'
                        ? '#fbcfe8'
                        : '#f5f5f5'
                    }}
                    onClick={() => note.highlight_id && scrollToHighlight(note.highlight_id)}
                  >
                    "{note.highlight.content}"
                  </div>
                )}
                <p className="whitespace-pre-wrap">{note.content}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(note.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => handleDeleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete note</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
} 