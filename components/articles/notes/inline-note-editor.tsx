"use client";

import { useState, useRef, useEffect } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SaveIcon, XIcon } from "lucide-react";

interface InlineNoteEditorProps {
  articleId: string;
  highlightId: string;
  highlightedText: string;
  position: { x: number, y: number };
  onClose: () => void;
  onSaved: () => void;
}

export function InlineNoteEditor({
  articleId,
  highlightId,
  highlightedText,
  position,
  onClose,
  onSaved
}: InlineNoteEditorProps) {
  const [noteContent, setNoteContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when it appears
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Calculate position for the editor
  // We want it on the right side of the screen for desktop
  // But on mobile, we'll place it below the highlight
  const editorStyle = {
    position: 'fixed' as const,
    zIndex: 50,
    maxWidth: '24rem', // max-w-sm
    width: window.innerWidth > 768 ? '24rem' : 'calc(100% - 2rem)',
    top: `${position.y}px`,
    right: window.innerWidth > 768 ? '2rem' : 'auto',
    left: window.innerWidth <= 768 ? '50%' : 'auto',
    transform: window.innerWidth <= 768 ? 'translateX(-50%)' : 'none',
  };

  // Handle saving the note
  const handleSaveNote = async () => {
    if (!user || !noteContent.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Create the note
      const { error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          article_id: articleId,
          highlight_id: highlightId,
          content: noteContent,
          updated_at: new Date().toISOString(),
        });
        
      if (error) {
        console.error("Error creating note:", error);
        toast({
          title: "Error creating note",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully",
      });
      
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error in note creation:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Save on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveNote();
    }
    
    // Close on Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="rounded-lg border bg-background p-4 shadow-lg"
      style={editorStyle}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium">Add Note</h3>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Highlighted text */}
      <div className="mb-3 rounded border-l-4 border-l-yellow-300 bg-muted/50 p-2 text-sm italic">
        "{highlightedText}"
      </div>

      {/* Note textarea */}
      <Textarea
        ref={textareaRef}
        value={noteContent}
        onChange={(e) => setNoteContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write your note..."
        className="min-h-[100px] resize-y"
      />

      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Press <kbd className="rounded border px-1 py-0.5">Ctrl</kbd>+<kbd className="rounded border px-1 py-0.5">Enter</kbd> to save
        </div>
        <Button 
          size="sm" 
          onClick={handleSaveNote} 
          disabled={isLoading || !noteContent.trim()}
        >
          {isLoading ? "Saving..." : "Save Note"}
          <SaveIcon className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 