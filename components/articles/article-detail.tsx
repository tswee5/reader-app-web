"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { useSupabase } from "@/components/providers/supabase-provider";
import { ReadingProgressTracker } from "@/components/articles/reading-progress-tracker";
import { TextHighlighter } from "@/components/articles/highlighting/text-highlighter";
import { TagSelector } from "@/components/articles/tags/tag-selector";
import { ArticleAIAssistant } from "@/components/articles/ai/article-ai-assistant";
import { ArticleSummarizer } from "@/components/articles/ai/article-summarizer";
import { ArticleQuestionAnswerer } from "@/components/articles/ai/article-question-answerer";
import { ArticleSpeechPlayer } from "@/components/articles/tts/article-speech-player";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { NoteList } from "@/components/articles/notes/note-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  BookOpen, 
  X, 
  Trash2, 
  ArrowUpRight,
  BookOpen as BookOpenIcon, 
  Highlighter as HighlighterIcon,
  GripVertical,
  Bot
} from "lucide-react";

type Article = {
  id: string;
  title: string;
  content: string;
  author?: string | null;
  published_date?: string | null;
  domain?: string | null;
  lead_image_url?: string | null;
  estimated_read_time?: number | null;
  reading_progress?: number | null;
};

// Define the Highlight type
type Highlight = {
  id: string;
  content: string;
  text_position_start: number;
  text_position_end: number;
  color: string;
  created_at: string;
};

// Define the Note type
type Note = {
  id: string;
  content: string;
  highlightId: string;
  highlightedText: string;
  highlightColor: string;
  createdAt: Date;
  updatedAt: Date;
};

interface ArticleDetailProps {
  articleId: string;
}

export function ArticleDetail({ articleId }: ArticleDetailProps) {
  const { supabase, user } = useSupabase();
  const [article, setArticle] = useState<Article | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  // Add state for notes functionality
  const [notes, setNotes] = useState<Note[]>([]);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("highlights");
  
  // Add state for resizable sidebar
  const [sidebarWidth, setSidebarWidth] = useState(400); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const minWidth = 300; // Minimum sidebar width
  const maxWidth = 800; // Maximum sidebar width
  const resizeRef = useRef<HTMLDivElement>(null);
  
  // Add state for screen width
  const [isMobile, setIsMobile] = useState(false);
  
  // Add state for active highlight
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  
  // Add state for mobile panel height
  const [mobilePanelHeight, setMobilePanelHeight] = useState(50); // Default 50vh (half screen)
  const minPanelHeight = 25; // Minimum 25vh
  const maxPanelHeight = 90; // Maximum 90vh
  const [touchStartY, setTouchStartY] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  
  // Load saved sidebar width from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('sidebarWidth');
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (!isNaN(width) && width >= minWidth && width <= maxWidth) {
          setSidebarWidth(width);
        }
      }
    }
  }, [minWidth, maxWidth]);
  
  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Fetch the article from the admin endpoint as a fallback
  const fetchArticleWithAdmin = async (id: string) => {
    try {
      const response = await fetch(`/api/debug?userId=${user?.id}&articleId=${id}`);
      const data = await response.json();
      
      if (data.article) {
        return data.article;
      }
      return null;
    } catch (err) {
      console.error("Error fetching with admin:", err);
      return null;
    }
  };

  useEffect(() => {
    const getArticle = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to fetch the article directly
        const { data, error } = await supabase
          .from("articles")
          .select("*")
          .eq("id", articleId)
          .single();

        if (error) {
          console.error("Error fetching article:", error);
          // Try admin fetch as fallback
          const adminArticle = await fetchArticleWithAdmin(articleId);
          if (adminArticle) {
            setArticle(adminArticle);
          } else {
            setError("Article not found");
          }
        } else if (data) {
          setArticle(data);
        } else {
          setError("Article not found");
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    getArticle();
  }, [articleId, supabase, user]);

  // Use proxied image if available - memoize this value
  const imageUrl = useMemo(() => 
    article?.lead_image_url 
      ? `/api/proxy?url=${encodeURIComponent(article.lead_image_url)}`
      : null,
    [article?.lead_image_url]
  );

  // Load highlights
  const loadHighlights = useCallback(async () => {
    if (!article || !user) return;

    try {
      const { data, error } = await supabase
        .from("highlights")
        .select("*")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error loading highlights:", error);
        return;
      }

      // If we have highlights from the DB, update our local state
      if (data && data.length > 0) {
        setHighlights(data);
      }
    } catch (err) {
      console.error("Unexpected error loading highlights:", err);
    }
  }, [articleId, article, supabase, user]);

  // Load notes for this article
  const loadNotes = useCallback(async () => {
    if (!article || !user) return;

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*, highlights(content, color)")
        .eq("article_id", articleId)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading notes:", error);
        return;
      }

      // Format notes for display
      const formattedNotes = data
        .filter(note => note.highlight_id !== null) // Filter out notes without highlights
        .map(note => ({
          id: note.id,
          content: note.content,
          highlightId: note.highlight_id as string, // Type assertion since we filtered null values
          highlightedText: note.highlights?.content || "",
          highlightColor: note.highlights?.color || "yellow",
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at)
        }));

      setNotes(formattedNotes);
    } catch (err) {
      console.error("Unexpected error loading notes:", err);
    }
  }, [articleId, article, supabase, user]);

  // Delete a note
  const deleteNote = async (noteId: string) => {
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
          title: "Error",
          description: "Failed to delete note.",
          variant: "destructive"
        });
        return;
      }

      // Remove the note from the local state
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));

      toast({
        title: "Note deleted",
        description: "Your note has been removed.",
      });
    } catch (err) {
      console.error("Unexpected error deleting note:", err);
    }
  };

  // Delete a highlight
  const deleteHighlight = async (highlightId: string) => {
    if (!user) return;

    try {
      // Check if there are notes associated with this highlight
      const { data: notesWithHighlight, error: notesError } = await supabase
        .from("notes")
        .select("id")
        .eq("highlight_id", highlightId);

      if (notesError) {
        console.error("Error checking notes for highlight:", notesError);
        return;
      }

      // If there are notes, ask for confirmation
      if (notesWithHighlight && notesWithHighlight.length > 0) {
        const confirmed = window.confirm(
          `This highlight has ${notesWithHighlight.length} note(s) attached. Deleting it will also delete these notes. Continue?`
        );
        if (!confirmed) return;

        // Delete associated notes first
        const { error: deleteNotesError } = await supabase
          .from("notes")
          .delete()
          .eq("highlight_id", highlightId);

        if (deleteNotesError) {
          console.error("Error deleting notes:", deleteNotesError);
          toast({
            title: "Error",
            description: "Failed to delete associated notes.",
            variant: "destructive"
          });
          return;
        }

        // Update notes state
        setNotes(prevNotes => prevNotes.filter(note => note.highlightId !== highlightId));
      }

      // Delete the highlight
      const { error } = await supabase
        .from("highlights")
        .delete()
        .eq("id", highlightId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error deleting highlight:", error);
        toast({
          title: "Error",
          description: "Failed to delete highlight.",
          variant: "destructive"
        });
        return;
      }

      // Remove highlight from DOM
      const articleElement = document.querySelector("article");
      if (articleElement) {
        const highlightMarker = articleElement.querySelector(`[data-highlight-id="${highlightId}"]`);
        if (highlightMarker && highlightMarker.parentNode) {
          highlightMarker.parentNode.replaceChild(
            document.createTextNode(highlightMarker.textContent || ""),
            highlightMarker
          );
        }
      }

      // Remove highlight from state
      setHighlights(prevHighlights => prevHighlights.filter(h => h.id !== highlightId));

      toast({
        title: "Highlight deleted",
        description: "Your highlight has been removed.",
      });
    } catch (err) {
      console.error("Unexpected error deleting highlight:", err);
    }
  };

  // Toggle notes management panel
  const toggleNotesPanel = () => {
    setShowNotesPanel(prev => !prev);
    // Load the latest notes when opening the panel
    if (!showNotesPanel) {
      loadNotes();
      loadHighlights();
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // Load initial data
  useEffect(() => {
    if (article && user) {
      loadHighlights();
      loadNotes();
    }
  }, [article, user, loadHighlights, loadNotes]);

  // Function to scroll to a highlight and emphasize the related note
  const scrollToHighlight = (highlightId: string, noteId?: string) => {
    // Find the highlight element in the DOM
    const highlightElement = document.querySelector(
      `[data-highlight-id="${highlightId}"]`
    );

    if (highlightElement) {
      // Set active note if a noteId is provided
      if (noteId) {
        setActiveNoteId(noteId);
        // Switch to notes tab when scrolling from a highlight to a note
        setActiveTab("notes");
      }

      // First clean up any existing highlights
      const existingHighlights = document.querySelectorAll(".highlight-pulse");
      existingHighlights.forEach(el => {
        el.classList.remove("highlight-pulse");
      });

      // Set active highlight
      setActiveHighlightId(highlightId);

      // Scroll to the highlight
      highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });

      // Apply a persistent highlight effect
      highlightElement.classList.add("highlight-pulse");
    }
  };

  // Add click event to clear active highlight when clicking elsewhere
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Skip if no active highlight
      if (!activeHighlightId) return;

      // Check if the click is on a highlight or within the notes panel
      const clickedElement = e.target as HTMLElement;
      const isHighlight = clickedElement.closest('.highlight-marker');
      const isNotesPanel = clickedElement.closest('[data-notes-panel]');
      const isHighlightButton = clickedElement.closest('[data-highlight-button]');

      if (!isHighlight && !isNotesPanel && !isHighlightButton) {
        // Remove pulse from current active highlight
        const activeHighlights = document.querySelectorAll(".highlight-pulse");
        activeHighlights.forEach(highlight => {
          highlight.classList.remove("highlight-pulse");
        });
        setActiveHighlightId(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [activeHighlightId]);

  // Apply highlight markers to the article content
  const applyHighlightMarkers = useCallback(() => {
    if (!highlights.length) return;

    // Add a small delay to ensure the article content is processed
    setTimeout(() => {
      const articleElement = document.querySelector("article");
      if (!articleElement) return;
      
      // Get existing highlights in the DOM
      const existingMarkers = articleElement.querySelectorAll(".highlight-marker");
      const existingHighlightIds = new Set();
      
      existingMarkers.forEach(marker => {
        const id = marker.getAttribute('data-highlight-id');
        if (id) existingHighlightIds.add(id);
      });
      
      // Only apply highlights that aren't already in the DOM
      const highlightsToApply = highlights.filter(h => !existingHighlightIds.has(h.id));
      
      // If nothing to apply, don't continue
      if (highlightsToApply.length === 0) return;
      
      // Apply each highlight that needs to be applied
      highlightsToApply.forEach((highlight) => {
        const textNodes = getTextNodesIn(articleElement);
        let currentPos = 0;
        
        // Track which nodes and offsets are part of this highlight
        const nodesToHighlight = [];
        
        // First pass: identify all nodes that contain parts of the highlight
        for (let i = 0; i < textNodes.length; i++) {
          const node = textNodes[i];
          const nodeTextLength = node.textContent?.length || 0;
          
          // Skip empty nodes
          if (nodeTextLength === 0) continue;
          
          const nodeStartPos = currentPos;
          const nodeEndPos = currentPos + nodeTextLength;
          
          // Check if this node contains any part of the highlight
          if (nodeEndPos > highlight.text_position_start && 
              nodeStartPos < highlight.text_position_end) {
            
            // Calculate highlight start and end offsets within this node
            const startOffset = Math.max(0, highlight.text_position_start - nodeStartPos);
            const endOffset = Math.min(nodeTextLength, highlight.text_position_end - nodeStartPos);
            
            nodesToHighlight.push({
              node,
              startOffset,
              endOffset
            });
          }
          
          currentPos += nodeTextLength;
        }
        
        // Second pass: apply highlights to all identified nodes
        for (const { node, startOffset, endOffset } of nodesToHighlight) {
          try {
            const range = document.createRange();
            range.setStart(node, startOffset);
            range.setEnd(node, endOffset);
            
            const highlightMarker = document.createElement("mark");
            highlightMarker.className = `bg-${highlight.color}-200 dark:bg-${highlight.color}-900/30 highlight-marker`;
            highlightMarker.dataset.highlightId = highlight.id;
            
            range.surroundContents(highlightMarker);
          } catch (err) {
            console.error("Error applying highlight to node:", err);
          }
        }
      });
    }, 100);
  }, [highlights]);

  // Helper function to get all text nodes within an element
  const getTextNodesIn = (element: Element): Node[] => {
    const textNodes: Node[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }
    
    return textNodes;
  };

  // Handle highlight creation - refresh data when activated
  const handleHighlightCreated = useCallback(() => {
    loadHighlights();
    loadNotes();
  }, [loadHighlights, loadNotes]);

  // Apply highlights when they change
  useEffect(() => {
    if (highlights.length > 0) {
      applyHighlightMarkers();
    }
  }, [highlights, applyHighlightMarkers]);

  // Set up a MutationObserver to watch for DOM changes that might remove highlights
  useEffect(() => {
    const articleElement = document.querySelector("article");
    if (!articleElement || !highlights.length) return;
    
    // Create a mutation observer to monitor for when highlights might be removed
    const observer = new MutationObserver((mutations) => {
      let highlightsRemoved = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // Check if any highlights were removed
          const currentHighlightElements = document.querySelectorAll(".highlight-marker");
          if (currentHighlightElements.length < highlights.length) {
            highlightsRemoved = true;
          }
        }
      });
      
      // If highlights were removed, reapply them
      if (highlightsRemoved) {
        applyHighlightMarkers();
      }
    });
    
    // Start observing with configuration
    observer.observe(articleElement, { 
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // Clean up observer on unmount
    return () => {
      observer.disconnect();
    };
  }, [highlights, applyHighlightMarkers]);

  // Add this helper function at the top of the component (after state declarations)
  const getHighlightColorClass = (color: string) => {
    switch (color) {
      case "yellow":
        return "bg-yellow-400 hover:bg-yellow-500";
      case "green":
        return "bg-green-400 hover:bg-green-500";
      case "blue":
        return "bg-blue-400 hover:bg-blue-500";
      case "purple":
        return "bg-purple-400 hover:bg-purple-500";
      case "pink":
        return "bg-pink-400 hover:bg-pink-500";
      default:
        return "bg-yellow-400 hover:bg-yellow-500";
    }
  };

  // Handle mouse down for sidebar resize - modify for better UX
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Update handleMouseMove for improved responsiveness
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    // Calculate new width based on mouse position
    const newWidth = Math.max(
      minWidth,
      Math.min(maxWidth, window.innerWidth - e.clientX)
    );
    
    // Apply the width change immediately for smooth resizing
    setSidebarWidth(newWidth);
  }, [isResizing]);

  // Handle mouse up to stop resizing and save width preference
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    
    // Auto-save the width preference when resizing ends
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarWidth', sidebarWidth.toString());
    }
  }, [handleMouseMove, sidebarWidth]);

  // Add effect to clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Adjust the font size calculation to ensure it scales better with the sidebar width
  const calculateFontSize = useMemo(() => {
    // More responsive scaling formula
    const minFontSize = 14;
    const maxFontSize = 20; // Increase max font size to make scaling more noticeable
    const widthRange = maxWidth - minWidth;
    
    // Calculate size with improved linear scaling
    const scaleFactor = Math.pow((sidebarWidth - minWidth) / widthRange, 0.8); // Slightly non-linear for better perception
    const fontSize = minFontSize + scaleFactor * (maxFontSize - minFontSize);
    
    // Round to nearest 0.5px for consistency
    return Math.max(minFontSize, Math.min(maxFontSize, Math.round(fontSize * 2) / 2));
  }, [sidebarWidth, minWidth, maxWidth]);
  
  // Calculate line height based on font size for better readability
  const calculateLineHeight = useMemo(() => {
    // Adjust line height based on font size - larger fonts need more line height
    return Math.min(1.8, 1.3 + (calculateFontSize - 14) * 0.06);
  }, [calculateFontSize]);

  // Add touch event handlers for mobile panel resizing
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    setTouchStartY(e.touches[0].clientY);
    setInitialHeight(mobilePanelHeight);
    setIsResizing(true);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isResizing || !isMobile) return;
    
    const touchY = e.touches[0].clientY;
    const deltaY = touchStartY - touchY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    
    // Increase height when dragging up, decrease when dragging down
    const newHeight = Math.max(
      minPanelHeight,
      Math.min(maxPanelHeight, initialHeight + deltaVh)
    );
    
    setMobilePanelHeight(newHeight);
  }, [isResizing, isMobile, touchStartY, initialHeight, minPanelHeight, maxPanelHeight]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile) return;
    setIsResizing(false);
    
    // Save panel height preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobilePanelHeight', mobilePanelHeight.toString());
    }
  }, [isMobile, mobilePanelHeight]);

  // Load saved mobile panel height from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isMobile) {
      const savedHeight = localStorage.getItem('mobilePanelHeight');
      if (savedHeight) {
        const height = parseInt(savedHeight, 10);
        if (!isNaN(height) && height >= minPanelHeight && height <= maxPanelHeight) {
          setMobilePanelHeight(height);
        }
      }
    }
  }, [isMobile, minPanelHeight, maxPanelHeight]);

  // Add effect to set up touch event listeners
  useEffect(() => {
    if (isMobile) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, handleTouchMove, handleTouchEnd]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
        <p className="ml-2">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container max-w-4xl py-10">
        <div className="rounded-lg border p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold">Article Not Found</h2>
          <p className="mb-4 text-muted-foreground">
            The article you're looking for could not be found
          </p>
          <button
            onClick={() => router.push('/library')}
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  // Format the date if available
  const formattedDate = article.published_date 
    ? format(new Date(article.published_date), "MMMM d, yyyy")
    : null;

  return (
    <div className="container max-w-4xl py-10">
      <Toaster />

      <style jsx global>{`
        body {
          ${isResizing ? 'cursor: ew-resize !important;' : ''}
          ${isResizing ? 'user-select: none !important;' : ''}
        }
        
        .highlight-pulse {
          position: relative;
          z-index: 10;
          box-shadow: 0 0 0 3px rgba(255, 220, 40, 0.7);
          border-radius: 2px;
          background-color: rgba(255, 220, 40, 0.2) !important;
          transition: box-shadow 0.3s ease, background-color 0.3s ease;
        }

        ${isMobile && showNotesPanel ? `
          :root {
            --panel-height: ${mobilePanelHeight}vh;
          }
        ` : ''}
      `}</style>
      
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex justify-between">
          <div></div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleNotesPanel}
              className="flex items-center gap-1"
              title="Manage Notes and Highlights"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Notes & Highlights</span>
              {(notes.length > 0 || highlights.length > 0) && (
                <Badge variant="secondary" className="ml-1">
                  {notes.length + highlights.length}
                </Badge>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/library')}
            >
              Back to Library
            </Button>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold">{article.title}</h1>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {article.author && (
            <span>By {article.author}</span>
          )}
          
          {article.domain && (
            <span className="rounded-full bg-secondary px-2 py-1 text-xs">
              {article.domain}
            </span>
          )}
          
          {article.published_date && (
            <span>
              Published {format(new Date(article.published_date), 'MMMM d, yyyy')}
            </span>
          )}
          
          {article.estimated_read_time && (
            <span>{article.estimated_read_time} min read</span>
          )}
        </div>
        
        {/* Tags section */}
        <div className="mt-2">
          <TagSelector articleId={article.id} />
        </div>
      </div>
      
      {/* Notes and Highlights Management Panel */}
      {showNotesPanel && (
        <div 
          className={`fixed z-50 rounded-t-lg border bg-background shadow-lg flex flex-col transition-all
            ${isResizing ? 'select-none' : ''} 
            ${isMobile ? 'left-0 right-0 bottom-0' : 'top-20 right-8 rounded-lg'}`}
          style={{ 
            width: isMobile ? '100%' : `${sidebarWidth}px`,
            height: isMobile ? `${mobilePanelHeight}vh` : 'auto',
            maxHeight: isMobile ? `${mobilePanelHeight}vh` : '80vh',
            overflow: 'hidden', // Prevent any overflow
            transition: isResizing ? 'none' : 'height 0.2s ease, max-height 0.2s ease'
          }}
          ref={resizeRef}
          data-notes-panel="true"
        >
          {/* Resize handle for entire left edge */}
          {!isMobile && (
            <div 
              className="absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize hover:bg-gray-200 dark:hover:bg-gray-700 z-10 group"
              onMouseDown={handleMouseDown}
            >
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border opacity-50"></div>
              <div className="absolute left-[6px] top-1/2 transform -translate-y-1/2 w-[4px] h-20 rounded-full bg-gray-300 dark:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          )}
          
          {/* Mobile drag handle - now with touch event handlers */}
          {isMobile && (
            <div 
              className={`flex flex-col items-center py-2 cursor-ns-resize touch-none ${isResizing ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              onTouchStart={handleTouchStart}
            >
              <div className="w-16 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center">
                <GripVertical className="h-3 w-3 mr-1" />
                <span>Drag to resize</span>
              </div>
            </div>
          )}
          
          <div className={`flex items-center justify-between border-b ${isMobile ? 'px-3 py-1.5 mb-1' : 'p-3 mb-2'}`}>
            <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>Notes & Highlights</h3>
            <Button variant="ghost" size="sm" onClick={toggleNotesPanel} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
            <div className={`overflow-hidden ${isMobile ? 'px-2' : 'px-4'}`}>
              <TabsList className={`grid w-full grid-cols-3 ${isMobile ? 'mb-2' : 'mb-4'}`}>
                <TabsTrigger value="notes" className="text-sm py-1.5">Notes ({notes.length})</TabsTrigger>
                <TabsTrigger value="highlights" className="text-sm py-1.5">Highlights ({highlights.length})</TabsTrigger>
                <TabsTrigger value="ai" className="text-sm py-1.5">AI <Bot className="ml-1 h-3 w-3" /></TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent 
              value="notes" 
              className={`overflow-y-auto ${isMobile ? `max-h-[calc(${mobilePanelHeight}vh-5rem)]` : 'max-h-[calc(80vh-6rem)]'} ${isMobile ? 'px-2 pb-2' : 'px-4 pb-4'}`}
              style={{ 
                fontSize: `${calculateFontSize}px`,
                lineHeight: calculateLineHeight,
                transition: isResizing ? 'none' : 'all 0.2s ease'
              }}
            >
              {notes.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <BookOpenIcon className="mx-auto mb-2 h-10 w-10 opacity-20" />
                  <p>No notes yet. Highlight text and click "Take a note" to add one.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notes.map(note => (
                    <div 
                      key={note.id} 
                      className={`rounded-md border p-3 transition-all duration-300 ${
                        activeNoteId === note.id ? 'border-primary bg-primary/5 shadow-sm' : ''
                      }`}
                    >
                      <div className="mb-2 flex items-start justify-between">
                        <Badge 
                          className={getHighlightColorClass(note.highlightColor)}
                        >
                          Note
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteNote(note.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                      
                      <p className="font-medium mb-2 break-words">"{note.content}"</p>
                      <p className="text-xs text-muted-foreground break-words">"{note.highlightedText}"</p>
                      
                      <div className="mt-2 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            scrollToHighlight(note.highlightId, note.id);
                          }}
                          data-highlight-button="true"
                        >
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                          Go to highlight
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent 
              value="highlights" 
              className={`overflow-y-auto ${isMobile ? `max-h-[calc(${mobilePanelHeight}vh-5rem)]` : 'max-h-[calc(80vh-6rem)]'} ${isMobile ? 'px-2 pb-2' : 'px-4 pb-4'}`}
              style={{ 
                fontSize: `${calculateFontSize}px`,
                lineHeight: calculateLineHeight,
                transition: isResizing ? 'none' : 'all 0.2s ease'
              }}
            >
              {highlights.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <HighlighterIcon className="mx-auto mb-2 h-10 w-10 opacity-20" />
                  <p>No highlights yet. Select text to highlight it.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {highlights.map(highlight => (
                    <div key={highlight.id} className="rounded-md border p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <div className={`h-3 w-3 rounded-full bg-${highlight.color}-400`} />
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteHighlight(highlight.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                      
                      <p className="mb-2 break-words">"{highlight.content}"</p>
                      
                      <div className="mt-2 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            scrollToHighlight(highlight.id);
                          }}
                          data-highlight-button="true"
                        >
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                          Go to highlight
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent 
              value="ai" 
              className={`overflow-y-auto ${isMobile ? `max-h-[calc(${mobilePanelHeight}vh-5rem)]` : 'max-h-[calc(80vh-6rem)]'} ${isMobile ? 'px-2 pb-2' : 'px-4 pb-4'}`}
              style={{ 
                fontSize: `${calculateFontSize}px`,
                lineHeight: calculateLineHeight,
                transition: isResizing ? 'none' : 'all 0.2s ease'
              }}
            >
              <div className="space-y-4">
                <ArticleSummarizer articleId={article.id} content={article.content} />
                <ArticleQuestionAnswerer articleId={article.id} content={article.content} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Reading progress */}
      <ReadingProgressTracker 
        articleId={article.id}
        initialProgress={article.reading_progress || 0}
      />
      
      {/* Featured image */}
      {imageUrl && (
        <div className="mb-8 mt-4 overflow-hidden rounded-lg">
          <Image
            src={imageUrl}
            alt={article.title}
            width={1200}
            height={630}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
      )}
      
      {/* Text-to-Speech Player */}
      <div className="mb-8">
        <ArticleSpeechPlayer 
          articleId={article.id} 
          content={article.content} 
          title={article.title}
        />
      </div>
      
      <div className="relative flex gap-6">
        {/* Main content with article */}
        <div 
          className={`relative flex-1 ${isMobile && showNotesPanel ? 'pb-[var(--panel-height)]' : ''}`}
          style={{
            transition: isResizing ? 'none' : 'padding-bottom 0.2s ease'
          }}
        >
          {user && (
            <TextHighlighter 
              articleId={article.id} 
              onHighlightCreated={handleHighlightCreated}
            />
          )}
          
          <article 
            className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          
          {/* AI Question Answerer */}
          <div className="mt-16 mb-8">
            <h2 className="mb-6 text-2xl font-bold">Ask AI About This Article</h2>
            <ArticleQuestionAnswerer articleId={article.id} content={article.content} />
          </div>
        </div>
      </div>
    </div>
  );
} 