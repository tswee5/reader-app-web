"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Pencil, Trash, Copy, Check, BookText, Highlighter, GripVertical, FileText, Plus } from "lucide-react";
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
import type { Summary } from "@/components/articles/summary/summary-manager";

interface Note {
  id: string;
  content: string;
  highlightId: string;
  highlightedText: string;
  highlightColor: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder?: number;
}

interface Highlight {
  id: string;
  content: string;
  text_position_start: number;
  text_position_end: number;
  color: string;
  created_at: string;
  article_id?: string;
  sortOrder?: number;
}

interface NotesPanelProps {
  notes: Note[];
  highlights: Highlight[];
  summaries: Summary[];
  onClose: () => void;
  onDeleteNote: (noteId: string) => Promise<void>;
  onDeleteHighlight: (highlightId: string) => Promise<void>;
  onDeleteSummary: (summaryId: string) => Promise<void>;
  onHighlightClick: (highlightId: string) => void;
  onUpdateNote: (noteId: string, content: string) => Promise<boolean>;
  onUpdateSummary: (summaryId: string, content: string) => Promise<boolean>;
  activeHighlightId: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefreshNotes?: () => Promise<void>;
  onRefreshSummaries?: () => Promise<void>;
  pendingNoteData?: {
    highlightId: string;
    selectedText: string;
  } | null;
  pendingSummaryData?: {
    dotIndex: number;
    articleId?: string;
    totalDots?: number;
  } | null;
  onClearPendingNoteData?: () => void;
  onClearPendingSummaryData?: () => void;
}

// NoteItem Component
interface NoteItemProps {
  note: Note;
  onDelete: (noteId: string) => void;
  onHighlightClick: (highlightId: string) => void;
  onUpdateNote: (noteId: string, content: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: 'above' | 'below' | null;
  onDragStart: (e: React.DragEvent, noteId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, noteId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetNoteId: string) => void;
}

function NoteItem({ 
  note, 
  onDelete, 
  onHighlightClick, 
  onUpdateNote, 
  isDragging,
  isDropTarget,
  dropPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop
}: NoteItemProps) {
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

  const handleNoteClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons or when editing
    if (isEditing || (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Scroll to and highlight the associated text
    onHighlightClick(note.highlightId);
  };

  return (
    <div className="relative">
      {/* Drop indicator above */}
      {isDropTarget && dropPosition === 'above' && (
        <div className="absolute -top-1 left-2 right-2 h-0.5 bg-primary rounded-full z-10" />
      )}
      
      <div 
        className={`dashboard-card mx-2 transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
          isEditing ? 'border-primary' : 'border-gray-100 hover:border-gray-200'
        } ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${
          isDropTarget ? 'ring-2 ring-emerald-200' : ''
        }`}
        draggable={!isEditing}
        onClick={handleNoteClick}
        onDragStart={(e) => onDragStart(e, note.id)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragEnter={(e) => onDragEnter(e, note.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, note.id)}
      >
      <div className="flex flex-col">
          <div className="flex items-start justify-between mb-2">
          <span 
              className={`inline-block px-2 py-1 rounded text-sm cursor-pointer hover:opacity-80 transition-opacity ${getHighlightColorClass(note.highlightColor)}`}
              onClick={(e) => {
                e.stopPropagation();
                onHighlightClick(note.highlightId);
              }}
          >
            {note.highlightedText.length > 50 
              ? `${note.highlightedText.substring(0, 50)}...` 
              : note.highlightedText}
          </span>
            {!isEditing && (
              <div className="cursor-grab active:cursor-grabbing ml-2 opacity-40 hover:opacity-70 transition-opacity">
                <GripVertical className="h-4 w-4" />
              </div>
            )}
        </div>
        
        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (editContent.trim()) {
                      handleSave();
                    }
                  }
                }}
              className="w-full p-2 border rounded-md min-h-[100px] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="mt-2 flex justify-end space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                  setIsEditing(false);
                  setEditContent(note.content);
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
              className="h-8 w-8 p-0"
              title="Edit note"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard();
                }}
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
                  onDelete(note.id);
                }}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              title="Delete note"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      </div>
      
      {/* Drop indicator below */}
      {isDropTarget && dropPosition === 'below' && (
        <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-primary rounded-full z-10" />
      )}
    </div>
  );
}

// HighlightItem Component
interface HighlightItemProps {
  highlight: Highlight;
  onDelete: (highlightId: string) => void;
  onClick: () => void;
  isActive: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: 'above' | 'below' | null;
  onDragStart: (e: React.DragEvent, highlightId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, highlightId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetHighlightId: string) => void;
}

function HighlightItem({ 
  highlight, 
  onDelete, 
  onClick, 
  isActive, 
  isDragging,
  isDropTarget,
  dropPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop
}: HighlightItemProps) {
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

  const handleHighlightClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // Call the onClick handler to scroll to and highlight the text
    onClick();
  };

  return (
    <div className="relative">
      {/* Drop indicator above */}
      {isDropTarget && dropPosition === 'above' && (
        <div className="absolute -top-1 left-2 right-2 h-0.5 bg-primary rounded-full z-10" />
      )}
      
      <div 
        className={`p-4 rounded-lg border-l-4 ${getHighlightColorClass(highlight.color)} border cursor-pointer mx-2 transition-all duration-200 hover:bg-accent/30 ${
        isActive ? 'bg-accent/50' : 'bg-card'
        } ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${
          isDropTarget ? 'ring-2 ring-primary/20' : ''
        }`}
        onClick={handleHighlightClick}
        draggable
        onDragStart={(e) => onDragStart(e, highlight.id)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragEnter={(e) => onDragEnter(e, highlight.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, highlight.id)}
      >
        <div className="flex items-start justify-between">
          <div className="whitespace-pre-wrap break-words text-sm flex-1">
        {highlight.content}
          </div>
          <div className="cursor-grab active:cursor-grabbing ml-2 opacity-40 hover:opacity-70 transition-opacity">
            <GripVertical className="h-4 w-4" />
          </div>
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
      
      {/* Drop indicator below */}
      {isDropTarget && dropPosition === 'below' && (
        <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-primary rounded-full z-10" />
      )}
    </div>
  );
}

// SummaryItem Component
interface SummaryItemProps {
  summary: Summary;
  dotIndex: number;
  totalDots: number;
  onDelete: (summaryId: string) => void;
  onUpdateSummary: (summaryId: string, content: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  dropPosition: 'above' | 'below' | null;
  onDragStart: (e: React.DragEvent, summaryId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, summaryId: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetSummaryId: string) => void;
}

function SummaryItem({ 
  summary, 
  dotIndex,
  totalDots,
  onDelete, 
  onUpdateSummary, 
  isDragging,
  isDropTarget,
  dropPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop
}: SummaryItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(summary.content);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const getPromptText = () => {
    if (dotIndex === 0) {
      return "Summarize what you've read so far";
    } else if (dotIndex === totalDots - 1) {
      return "Summarize the entire article";
    } else {
      return "Summarize what you've read since the last checkpoint and tie it back to the previous checkpoint";
    }
  };

  const handleSave = () => {
    onUpdateSummary(summary.id, editContent);
    setIsEditing(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary.content);
    setIsCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "Summary content has been copied to clipboard",
      duration: 2000,
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative">
      {/* Drop indicator above */}
      {isDropTarget && dropPosition === 'above' && (
        <div className="absolute -top-1 left-2 right-2 h-0.5 bg-primary rounded-full z-10" />
      )}
      
      <div 
        className={`p-4 rounded-lg border bg-card mx-2 transition-all duration-200 ${
          isEditing ? 'border-primary' : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
        } ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} ${
          isDropTarget ? 'ring-2 ring-primary/20' : ''
        }`}
        draggable={!isEditing}
        onDragStart={(e) => onDragStart(e, summary.id)}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragEnter={(e) => onDragEnter(e, summary.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, summary.id)}
      >
        <div className="flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <span className="inline-block px-2 py-1 rounded text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 font-medium">
              {getPromptText()}
            </span>
            {!isEditing && (
              <div className="cursor-grab active:cursor-grabbing ml-2 opacity-40 hover:opacity-70 transition-opacity">
                <GripVertical className="h-4 w-4" />
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (editContent.trim()) {
                      handleSave();
                    }
                  }
                }}
                className="w-full p-2 border rounded-md min-h-[100px] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <div className="mt-2 flex justify-end space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                    setEditContent(summary.content);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-2 whitespace-pre-wrap break-words text-sm">
              {summary.content}
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {formatDate(summary.updatedAt)}
            </div>
            <div className="flex space-x-1">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="h-8 w-8 p-0"
                title="Edit summary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard();
                }}
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
                  onDelete(summary.id);
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Delete summary"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Drop indicator below */}
      {isDropTarget && dropPosition === 'below' && (
        <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-primary rounded-full z-10" />
      )}
    </div>
  );
}

export function NotesPanel({
  notes,
  highlights,
  summaries,
  onClose,
  onDeleteNote,
  onDeleteHighlight,
  onDeleteSummary,
  onHighlightClick,
  onUpdateNote,
  onUpdateSummary,
  activeHighlightId,
  activeTab,
  setActiveTab,
  onRefreshNotes,
  onRefreshSummaries,
  pendingNoteData,
  pendingSummaryData,
  onClearPendingNoteData,
  onClearPendingSummaryData,
}: NotesPanelProps) {
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [highlightToDelete, setHighlightToDelete] = useState<string | null>(null);
  const [summaryToDelete, setSummaryToDelete] = useState<string | null>(null);
  const [newNoteMode, setNewNoteMode] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newSummaryMode, setNewSummaryMode] = useState(false);
  const [newSummaryContent, setNewSummaryContent] = useState("");
  const [activeHighlight, setActiveHighlight] = useState<Highlight | null>(null);
  const [activeSummaryData, setActiveSummaryData] = useState<{ dotIndex: number; articleId?: string; totalDots?: number } | null>(null);
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [draggedHighlightId, setDraggedHighlightId] = useState<string | null>(null);
  const [draggedSummaryId, setDraggedSummaryId] = useState<string | null>(null);
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);
  const [sortedHighlights, setSortedHighlights] = useState<Highlight[]>([]);
  const [sortedSummaries, setSortedSummaries] = useState<Summary[]>([]);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [dragOverHighlightId, setDragOverHighlightId] = useState<string | null>(null);
  const [dragOverSummaryId, setDragOverSummaryId] = useState<string | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null);
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize sorted arrays when props change
  useEffect(() => {
    // Sort notes by sortOrder (if available) or by updatedAt (newest first)
    const sorted = [...notes].sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    setSortedNotes(sorted);
  }, [notes]);

  useEffect(() => {
    // Filter highlights to only show those without associated notes, then sort
    const highlightsWithoutNotes = highlights.filter(highlight => 
      !notes.some(note => note.highlightId === highlight.id)
    );
    
    const sorted = [...highlightsWithoutNotes].sort((a, b) => {
      if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
        return a.sortOrder - b.sortOrder;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    setSortedHighlights(sorted);
  }, [highlights, notes]);

  useEffect(() => {
    // Sort summaries by dotIndex
    const sorted = [...summaries].sort((a, b) => a.dotIndex - b.dotIndex);
    setSortedSummaries(sorted);
  }, [summaries]);

  // Handle note drag and drop
  const handleNoteDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', noteId);
  };

  const handleNoteDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverNoteId(null);
    setDropPosition(null);
  };

  const handleNoteDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Get the target element and determine drop position
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'above' : 'below';
    
    setDropPosition(position);
  };

  const handleNoteDragEnter = (e: React.DragEvent, noteId: string) => {
    e.preventDefault();
    if (draggedNoteId && draggedNoteId !== noteId) {
      setDragOverNoteId(noteId);
    }
  };

  const handleNoteDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire item, not just moving between child elements
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverNoteId(null);
      setDropPosition(null);
    }
  };

  const handleNoteDrop = async (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    
    if (!draggedNoteId || draggedNoteId === targetNoteId || !user?.id) return;

    const draggedIndex = sortedNotes.findIndex(note => note.id === draggedNoteId);
    const targetIndex = sortedNotes.findIndex(note => note.id === targetNoteId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new array with reordered items
    const newSortedNotes = [...sortedNotes];
    const [draggedNote] = newSortedNotes.splice(draggedIndex, 1);
    
    // Determine the insertion index based on drop position
    let insertIndex = targetIndex;
    if (dropPosition === 'below') {
      insertIndex = targetIndex + 1;
    }
    
    // Adjust for the removed item if we're inserting after the original position
    if (draggedIndex < insertIndex) {
      insertIndex -= 1;
    }
    
    newSortedNotes.splice(insertIndex, 0, draggedNote);

    // Update local state immediately for smooth UX
    setSortedNotes(newSortedNotes);

    // Clear drag state
    setDraggedNoteId(null);
    setDragOverNoteId(null);
    setDropPosition(null);

    // TODO: Update sort orders in database when sort_order column is added
    // For now, the reordering only persists in the current session
    try {
      // Placeholder for future database update
      console.log('Note reordering - database update pending schema changes');
    } catch (error) {
      console.error('Error updating note order:', error);
      // Revert on error
      if (onRefreshNotes) {
        onRefreshNotes();
      }
    }
  };

  // Handle highlight drag and drop
  const handleHighlightDragStart = (e: React.DragEvent, highlightId: string) => {
    setDraggedHighlightId(highlightId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', highlightId);
  };

  const handleHighlightDragEnd = () => {
    setDraggedHighlightId(null);
    setDragOverHighlightId(null);
    setDropPosition(null);
  };

  const handleHighlightDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Get the target element and determine drop position
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'above' : 'below';
    
    setDropPosition(position);
  };

  const handleHighlightDragEnter = (e: React.DragEvent, highlightId: string) => {
    e.preventDefault();
    if (draggedHighlightId && draggedHighlightId !== highlightId) {
      setDragOverHighlightId(highlightId);
    }
  };

  const handleHighlightDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire item, not just moving between child elements
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverHighlightId(null);
      setDropPosition(null);
    }
  };

  const handleHighlightDrop = async (e: React.DragEvent, targetHighlightId: string) => {
    e.preventDefault();
    
    if (!draggedHighlightId || draggedHighlightId === targetHighlightId || !user?.id) return;

    const draggedIndex = sortedHighlights.findIndex(highlight => highlight.id === draggedHighlightId);
    const targetIndex = sortedHighlights.findIndex(highlight => highlight.id === targetHighlightId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new array with reordered items
    const newSortedHighlights = [...sortedHighlights];
    const [draggedHighlight] = newSortedHighlights.splice(draggedIndex, 1);
    
    // Determine the insertion index based on drop position
    let insertIndex = targetIndex;
    if (dropPosition === 'below') {
      insertIndex = targetIndex + 1;
    }
    
    // Adjust for the removed item if we're inserting after the original position
    if (draggedIndex < insertIndex) {
      insertIndex -= 1;
    }
    
    newSortedHighlights.splice(insertIndex, 0, draggedHighlight);

    // Update local state immediately for smooth UX
    setSortedHighlights(newSortedHighlights);

    // Clear drag state
    setDraggedHighlightId(null);
    setDragOverHighlightId(null);
    setDropPosition(null);

    // TODO: Update sort orders in database when sort_order column is added
    // For now, the reordering only persists in the current session
    try {
      // Placeholder for future database update
      console.log('Highlight reordering - database update pending schema changes');
    } catch (error) {
      console.error('Error updating highlight order:', error);
      // Revert on error by refreshing
      if (onRefreshNotes) {
        onRefreshNotes();
      }
    }
  };

  // Handle summary drag and drop
  const handleSummaryDragStart = (e: React.DragEvent, summaryId: string) => {
    setDraggedSummaryId(summaryId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', summaryId);
  };

  const handleSummaryDragEnd = () => {
    setDraggedSummaryId(null);
    setDragOverSummaryId(null);
    setDropPosition(null);
  };

  const handleSummaryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? 'above' : 'below';
    
    setDropPosition(position);
  };

  const handleSummaryDragEnter = (e: React.DragEvent, summaryId: string) => {
    e.preventDefault();
    if (draggedSummaryId && draggedSummaryId !== summaryId) {
      setDragOverSummaryId(summaryId);
    }
  };

  const handleSummaryDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverSummaryId(null);
      setDropPosition(null);
    }
  };

  const handleSummaryDrop = async (e: React.DragEvent, targetSummaryId: string) => {
    e.preventDefault();
    
    if (!draggedSummaryId || draggedSummaryId === targetSummaryId || !user?.id) return;

    const draggedIndex = sortedSummaries.findIndex(summary => summary.id === draggedSummaryId);
    const targetIndex = sortedSummaries.findIndex(summary => summary.id === targetSummaryId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newSortedSummaries = [...sortedSummaries];
    const [draggedSummary] = newSortedSummaries.splice(draggedIndex, 1);
    
    let insertIndex = targetIndex;
    if (dropPosition === 'below') {
      insertIndex = targetIndex + 1;
    }
    
    if (draggedIndex < insertIndex) {
      insertIndex -= 1;
    }
    
    newSortedSummaries.splice(insertIndex, 0, draggedSummary);

    setSortedSummaries(newSortedSummaries);

    setDraggedSummaryId(null);
    setDragOverSummaryId(null);
    setDropPosition(null);

    try {
      console.log('Summary reordering - database update pending schema changes');
    } catch (error) {
      console.error('Error updating summary order:', error);
      if (onRefreshSummaries) {
        onRefreshSummaries();
      }
    }
  };

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

  // Handle pending note data from text selection
  useEffect(() => {
    if (pendingNoteData) {
      const targetHighlight = highlights.find(h => h.id === pendingNoteData.highlightId);
      if (targetHighlight) {
        // Check if this highlight already has a note
        const existingNote = notes.find(n => n.highlightId === pendingNoteData.highlightId);
        if (!existingNote) {
          // Set up new note creation with the pending data
          setActiveHighlight(targetHighlight);
          setNewNoteMode(true);
          setNewNoteContent("");
          setActiveTab("notes");
          
          // Clear the pending data
          if (onClearPendingNoteData) {
            onClearPendingNoteData();
          }
          
          // Focus the textarea after a short delay to allow rendering
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }, 100);
        }
      }
    }
  }, [pendingNoteData, highlights, notes, onClearPendingNoteData]);

  // Handle saving a new note
  const saveNewNote = async () => {
    if (!user?.id || !activeHighlight || !newNoteContent.trim()) return;

    try {
      // Create the note in the database (sort_order will be added later)
      const { error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          article_id: activeHighlight.article_id || "",
          highlight_id: activeHighlight.id,
          content: newNoteContent,
          updated_at: new Date().toISOString(),
          // TODO: Add sort_order: 0 when database schema is updated
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

      // TODO: Update sort orders for existing notes when sort_order column is added
      // For now, new notes will appear at the top based on updated_at timestamp

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

  // Handle pending summary data from dot clicks
  useEffect(() => {
    if (pendingSummaryData) {
      setActiveSummaryData(pendingSummaryData);
      setNewSummaryMode(true);
      setNewSummaryContent("");
      setActiveTab("summary");
      
      if (onClearPendingSummaryData) {
        onClearPendingSummaryData();
      }
      
      setTimeout(() => {
        if (summaryTextareaRef.current) {
          summaryTextareaRef.current.focus();
        }
      }, 100);
    }
  }, [pendingSummaryData, onClearPendingSummaryData]);

  // Handle saving a new summary
  const saveNewSummary = async () => {
    if (!user?.id || !activeSummaryData || !newSummaryContent.trim()) return;

    try {
      const { error } = await (supabase as any)
        .from("summaries")
        .insert({
          user_id: user.id,
          article_id: activeSummaryData.articleId || "",
          dot_index: activeSummaryData.dotIndex,
          content: newSummaryContent,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("Error creating summary:", error);
        toast({
          title: "Error",
          description: "Failed to save summary",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Summary saved",
        description: "Your summary has been saved successfully",
      });

      setNewSummaryMode(false);
      setNewSummaryContent("");
      setActiveSummaryData(null);

      if (onRefreshSummaries) {
        await onRefreshSummaries();
      }
    } catch (error) {
      console.error("Error saving summary:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const getPromptText = (dotIndex: number, totalDots: number) => {
    if (dotIndex === 0) {
      return "Summarize what you've read so far";
    } else if (dotIndex === totalDots - 1) {
      return "Summarize the entire article";
    } else {
      return "Summarize what you've read since the last checkpoint and tie it back to the previous checkpoint";
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
    <div className="h-full flex flex-col floating-panel">
      <div className="flex justify-center items-center px-6 py-4 border-b border-gray-100">
        <h2 className="dashboard-header">Notes & Highlights</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute right-2 sidebar-item"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex justify-center pt-6 pb-4">
        <Tabs 
          defaultValue="notes" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'notes' | 'highlights' | 'summary')}
          className="w-full"
        >
          <div className="flex justify-center mb-4">
            <TabsList className="w-4/5 grid grid-cols-3 dashboard-input-container">
              <TabsTrigger value="notes" className="rounded-xl">
                Notes
              </TabsTrigger>
              <TabsTrigger value="highlights" className="rounded-xl">
                Highlights
              </TabsTrigger>
              <TabsTrigger value="summary" className="rounded-xl">
                Summary
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notes" className="mt-0">
            <ScrollArea className="h-[calc(100vh-120px)] px-6 py-2">
              {/* New Note Entry Form */}
              {newNoteMode && activeHighlight && (
                <div className="mb-6 dashboard-card mx-2 border-emerald-300">
                  {/* Highlighted text in yellow box */}
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 rounded text-sm bg-yellow-200 dark:bg-yellow-900">
                    {activeHighlight.content}
                    </span>
                  </div>
                  
                  {/* Note textarea with proper border styling */}
                  <div className="mt-2">
                    <Textarea
                      ref={textareaRef}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newNoteContent.trim()) {
                            saveNewNote();
                          }
                        }
                      }}
                      placeholder="Enter your note here..."
                      className="w-full p-2 border rounded-md min-h-[100px] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  
                  {/* Date and buttons */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {formatCurrentDate()}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm"
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
                        size="sm"
                        className="btn-emerald"
                        onClick={saveNewNote}
                        disabled={!newNoteContent.trim()}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Existing Notes List */}
              {sortedNotes.length === 0 && !newNoteMode ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <BookText className="h-8 w-8 text-neutral-400 mb-2" />
                  <p className="text-neutral-500">No notes yet. Highlight text and add notes to see them here.</p>
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {sortedNotes.map((note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      onDelete={onDeleteNote}
                      onHighlightClick={onHighlightClick}
                      onUpdateNote={onUpdateNote}
                      isDragging={draggedNoteId === note.id}
                      isDropTarget={dragOverNoteId === note.id}
                      dropPosition={dropPosition}
                      onDragStart={handleNoteDragStart}
                      onDragEnd={handleNoteDragEnd}
                      onDragOver={handleNoteDragOver}
                      onDragEnter={handleNoteDragEnter}
                      onDragLeave={handleNoteDragLeave}
                      onDrop={handleNoteDrop}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="highlights" className="mt-0">
            <ScrollArea className="h-[calc(100vh-120px)] px-6 py-2">
              {sortedHighlights.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <Highlighter className="h-8 w-8 text-neutral-400 mb-2" />
                  <p className="text-neutral-500">
                    {highlights.length === 0 
                      ? "No highlights yet. Select text and highlight to save key passages."
                      : "All highlights have notes attached. Highlights without notes will appear here."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pb-2">
                  {sortedHighlights.map((highlight) => (
                    <HighlightItem
                      key={highlight.id}
                      highlight={highlight}
                      onDelete={onDeleteHighlight}
                      onClick={() => onHighlightClick(highlight.id)}
                      isActive={highlight.id === activeHighlightId}
                      isDragging={draggedHighlightId === highlight.id}
                      isDropTarget={dragOverHighlightId === highlight.id}
                      dropPosition={dropPosition}
                      onDragStart={handleHighlightDragStart}
                      onDragEnd={handleHighlightDragEnd}
                      onDragOver={handleHighlightDragOver}
                      onDragEnter={handleHighlightDragEnter}
                      onDragLeave={handleHighlightDragLeave}
                      onDrop={handleHighlightDrop}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="summary" className="mt-4 space-y-4 pl-8">
            {newSummaryMode && activeSummaryData && (
              <div className="space-y-3 p-4 border rounded-lg bg-muted/50 mx-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">
                    {getPromptText(activeSummaryData.dotIndex, activeSummaryData.totalDots || 1)}
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNewSummaryMode(false);
                      setNewSummaryContent("");
                      setActiveSummaryData(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  ref={summaryTextareaRef}
                  value={newSummaryContent}
                  onChange={(e) => setNewSummaryContent(e.target.value)}
                  placeholder="Write your summary here..."
                  className="min-h-[100px] resize-none"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNewSummaryMode(false);
                      setNewSummaryContent("");
                      setActiveSummaryData(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveNewSummary}
                    disabled={!newSummaryContent.trim()}
                  >
                    Save Summary
                  </Button>
                </div>
              </div>
            )}

            {sortedSummaries.length > 0 ? (
              <div className="space-y-2">
                {sortedSummaries.map((summary, index) => (
                  <SummaryItem
                    key={summary.id}
                    summary={summary}
                    dotIndex={summary.dotIndex}
                    totalDots={sortedSummaries.length}
                    onDelete={() => {
                      setSummaryToDelete(summary.id);
                    }}
                    onUpdateSummary={async (content: string) => {
                      if (!user?.id) return;
                      
                      try {
                        const { error } = await (supabase as any)
                          .from("summaries")
                          .update({ 
                            content,
                            updated_at: new Date().toISOString()
                          })
                          .eq("id", summary.id)
                          .eq("user_id", user.id);

                        if (error) {
                          console.error("Error updating summary:", error);
                          toast({
                            title: "Error",
                            description: "Failed to update summary",
                            variant: "destructive",
                          });
                          return;
                        }

                        toast({
                          title: "Summary updated",
                          description: "Your summary has been updated successfully",
                        });

                        if (onRefreshSummaries) {
                          await onRefreshSummaries();
                        }
                      } catch (error) {
                        console.error("Error updating summary:", error);
                        toast({
                          title: "Error",
                          description: "An unexpected error occurred",
                          variant: "destructive",
                        });
                      }
                    }}
                    onDragStart={(e) => handleSummaryDragStart(e, summary.id)}
                    onDragEnd={handleSummaryDragEnd}
                    onDragOver={handleSummaryDragOver}
                    onDragEnter={(e) => handleSummaryDragEnter(e, summary.id)}
                    onDragLeave={handleSummaryDragLeave}
                    onDrop={(e) => handleSummaryDrop(e, summary.id)}
                    isDragging={draggedSummaryId === summary.id}
                    isDropTarget={dragOverSummaryId === summary.id}
                    dropPosition={dragOverSummaryId === summary.id ? dropPosition : null}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No summaries yet</p>
                <p className="text-xs mt-1">Click the dots in the article to create summaries</p>
              </div>
            )}
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

      {/* Delete Summary Dialog */}
      <AlertDialog open={!!summaryToDelete} onOpenChange={() => setSummaryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Summary</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this summary? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (summaryToDelete) {
                  onDeleteSummary(summaryToDelete);
                  setSummaryToDelete(null);
                  toast({
                    title: "Summary deleted",
                    description: "Your summary has been deleted successfully",
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