"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Pencil, Trash, Copy, Check, BookText, Highlighter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useSupabase } from "@/components/providers/supabase-provider";
import { Textarea } from "@/components/ui/textarea";

interface Note {
  id: string;
  content: string;
  highlightId: string;
  highlightedText: string;
  highlightColor: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Highlight {
  id: string;
  content: string;
  text_position_start: number;
  text_position_end: number;
  color: string;
  created_at: string;
  article_id?: string;
}

interface NotesPanelProps {
  notes: Note[];
  highlights: Highlight[];
  onClose: () => void;
  onDeleteNote: (noteId: string) => Promise<void>;
  onDeleteHighlight: (highlightId: string) => Promise<void>;
  onHighlightClick: (highlightId: string) => void;
  onUpdateNote: (noteId: string, content: string) => Promise<boolean>;
  activeHighlightId: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefreshNotes?: () => Promise<void>;
}

// NoteItem Component
interface NoteItemProps {
  note: Note;
  onDelete: (noteId: string) => void;
  onHighlightClick: (highlightId: string) => void;
  onUpdateNote: (noteId: string, content: string) => void;
}

function NoteItem({ note, onDelete, onHighlightClick, onUpdateNote }: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const getHighlightColorClass = (color: string) => {
    switch(color) {
      case 'yellow':
        return 'bg-yellow-200 dark:bg-yellow-900';
      case 'green':
        return 'bg-green-200 dark:bg-green-900';
      case 'blue':
        return 'bg-blue-200 dark:bg-blue-900';
      case 'purple':
        return 'bg-purple-200 dark:bg-purple-900';
      case 'pink':
        return 'bg-pink-200 dark:bg-pink-900';
      default:
        return 'bg-yellow-200 dark:bg-yellow-900';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const handleSave = () => {
    onUpdateNote(note.id, editContent);
    setIsEditing(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(note.content);
    setIsCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Note content has been copied to clipboard",
      duration: 2000,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className={`p-4 rounded-lg border bg-card mx-2 ${
      isEditing ? 'border-primary' : 'border-neutral-200 dark:border-neutral-800'
    }`}>
      <div className="flex flex-col">
        <div className="mb-2">
          <span 
            className={`inline-block px-2 py-1 rounded text-sm cursor-pointer ${getHighlightColorClass(note.highlightColor)}`}
            onClick={() => onHighlightClick(note.highlightId)}
          >
            {note.highlightedText.length > 50 
              ? `${note.highlightedText.substring(0, 50)}...` 
              : note.highlightedText}
          </span>
        </div>
        
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full p-2 border rounded-md min-h-[100px] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="mt-2 flex justify-end space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(note.content);
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2 whitespace-pre-wrap break-words text-sm">
            {note.content}
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {formatDate(note.updatedAt)}
          </div>
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-8 w-8 p-0"
              title="Edit note"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0"
              title="Copy to clipboard"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onDelete(note.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Delete note"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// HighlightItem Component
interface HighlightItemProps {
  highlight: Highlight;
  onDelete: (highlightId: string) => void;
  onClick: () => void;
  isActive: boolean;
}

function HighlightItem({ highlight, onDelete, onClick, isActive }: HighlightItemProps) {
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(highlight.content);
    setIsCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Highlight content has been copied to clipboard",
      duration: 2000,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getHighlightColorClass = (color: string) => {
    switch(color) {
      case 'yellow':
        return 'border-l-yellow-400';
      case 'green':
        return 'border-l-green-400';
      case 'blue':
        return 'border-l-blue-400';
      case 'purple':
        return 'border-l-purple-400';
      case 'pink':
        return 'border-l-pink-400';
      default:
        return 'border-l-yellow-400';
    }
  };

  return (
    <div 
      className={`p-4 rounded-lg border-l-4 ${getHighlightColorClass(highlight.color)} border cursor-pointer mx-2 ${
        isActive ? 'bg-accent/50' : 'bg-card'
      }`}
      onClick={onClick}
    >
      <div className="whitespace-pre-wrap break-words text-sm">
        {highlight.content}
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {formatDateTime(highlight.created_at)}
        </div>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={copyToClipboard}
            className="h-8 w-8 p-0"
            title="Copy to clipboard"
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(highlight.id);
            }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            title="Delete highlight"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NotesPanel({
  notes,
  highlights,
  onClose,
  onDeleteNote,
  onDeleteHighlight,
  onHighlightClick,
  onUpdateNote,
  activeHighlightId,
  activeTab,
  setActiveTab,
  onRefreshNotes,
}: NotesPanelProps) {
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [highlightToDelete, setHighlightToDelete] = useState<string | null>(null);
  const [newNoteMode, setNewNoteMode] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null);
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle starting a new note for a specific highlight
  const startNewNote = (highlight: Highlight) => {
    setActiveHighlight(highlight);
    setNewNoteMode(true);
    setNewNoteContent("");
    setActiveTab("notes");
    
    // Focus the textarea after a short delay to allow rendering
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  // Process a highlight to start a new note if needed
  useEffect(() => {
    if (activeHighlightId) {
      const targetHighlight = highlights.find(h => h.id === activeHighlightId);
      if (targetHighlight) {
        // Check if this highlight already has a note
        const existingNote = notes.find(n => n.highlightId === activeHighlightId);
        if (!existingNote) {
          // If no note exists for this highlight, start a new note
          startNewNote(targetHighlight);
        }
      }
    }
  }, [activeHighlightId, highlights, notes]);

  // Handle saving a new note
  const saveNewNote = async () => {
    if (!user || !activeHighlight || !newNoteContent.trim()) return;

    try {
      // Create the note in the database
      const { error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          article_id: activeHighlight.article_id || "",
          highlight_id: activeHighlight.id,
          content: newNoteContent,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error creating note:", error);
        toast({
          title: "Error",
          description: "Failed to save note",
          variant: "destructive",
        });
        return;
      }

      // Show success message
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully",
      });

      // Clear new note mode
      setNewNoteMode(false);
      setNewNoteContent("");
      setActiveHighlight(null);

      // Refresh notes if callback is provided
      if (onRefreshNotes) {
        await onRefreshNotes();
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Format date for displaying current time
  const formatCurrentDate = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(now);
  };

  return (
    <div className="h-full flex flex-col border-neutral-200 dark:border-neutral-800">
      <div className="flex justify-center items-center px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Notes & Highlights</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 absolute right-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-center pt-4 pb-2">
        <Tabs 
          defaultValue="notes" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'notes' | 'highlights')}
          className="w-full"
        >
          <div className="flex justify-center mb-2">
            <TabsList className="w-4/5 grid grid-cols-2">
              <TabsTrigger value="notes">
                Notes
              </TabsTrigger>
              <TabsTrigger value="highlights">
                Highlights
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notes" className="mt-0">
            <ScrollArea className="h-[calc(100vh-120px)] px-6 py-2">
              {/* New Note Entry Form */}
              {newNoteMode && activeHighlight && (
                <div className="mb-4 rounded-lg border p-4">
                  {/* Highlighted text in yellow box */}
                  <div className="bg-yellow-200 py-1 px-2 rounded mb-4 inline-block w-full">
                    {activeHighlight.content}
                  </div>
                  
                  {/* Note textarea in a simple bordered container */}
                  <div className="border rounded-lg mb-4">
                    <Textarea
                      ref={textareaRef}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Enter your note here..."
                      className="border-0 resize-none focus-visible:ring-0 p-2 shadow-none min-h-[100px]"
                    />
                  </div>
                  
                  {/* Date and buttons */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {formatCurrentDate()}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setNewNoteMode(false);
                          setNewNoteContent("");
                          setActiveHighlight(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="default"
                        onClick={saveNewNote}
                        disabled={!newNoteContent.trim()}
                        className="bg-slate-900"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Existing Notes List */}
              {notes.length === 0 && !newNoteMode ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <BookText className="h-8 w-8 text-neutral-400 mb-2" />
                  <p className="text-neutral-500">No notes yet. Highlight text and add notes to see them here.</p>
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {notes.map((note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      onDelete={onDeleteNote}
                      onHighlightClick={onHighlightClick}
                      onUpdateNote={onUpdateNote}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="highlights" className="mt-0">
            <ScrollArea className="h-[calc(100vh-120px)] px-6 py-2">
              {highlights.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <Highlighter className="h-8 w-8 text-neutral-400 mb-2" />
                  <p className="text-neutral-500">No highlights yet. Select text and highlight to save key passages.</p>
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {highlights.map((highlight) => (
                    <HighlightItem
                      key={highlight.id}
                      highlight={highlight}
                      onDelete={onDeleteHighlight}
                      onClick={() => onHighlightClick(highlight.id)}
                      isActive={highlight.id === activeHighlightId}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Note Dialog */}
      <AlertDialog open={!!noteToDelete} onOpenChange={() => setNoteToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (noteToDelete) {
                  onDeleteNote(noteToDelete);
                  setNoteToDelete(null);
                  toast({
                    title: "Note deleted",
                    description: "Your note has been deleted successfully",
                  });
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Highlight Dialog */}
      <AlertDialog open={!!highlightToDelete} onOpenChange={() => setHighlightToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Highlight</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this highlight? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (highlightToDelete) {
                  onDeleteHighlight(highlightToDelete);
                  setHighlightToDelete(null);
                  toast({
                    title: "Highlight deleted",
                    description: "Your highlight has been deleted successfully",
                  });
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 