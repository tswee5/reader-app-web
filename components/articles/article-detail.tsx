"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { useSupabase } from "@/components/providers/supabase-provider";
import { TextHighlighter } from "@/components/articles/highlighting/text-highlighter";
import { TagSelector } from "@/components/articles/tags/tag-selector";
import { ArticleAIAssistant } from "@/components/articles/ai/article-ai-assistant";
import { ArticleSpeechPlayer } from "@/components/articles/tts/article-speech-player";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { 
  X,
  Bot,
  MoreVertical,
  Copy,
  Check,
  Pencil,
  ArrowLeft,
  Plus,
  Edit,
  Trash,
  ArrowRight,
  ExternalLink
} from "lucide-react";
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
import { ArticleToolbar } from "@/components/articles/toolbar/article-toolbar";

type Article = {
  id: string;
  title: string;
  content: string;
  author?: string | null;
  published_date?: string | null;
  domain?: string | null;
  url?: string | null;
  lead_image_url?: string | null;
  estimated_read_time?: number | null;
  reading_progress?: number | null;
  tags?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
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
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width in pixels 
  const [isResizing, setIsResizing] = useState(false);
  const minWidth = 280; // Minimum sidebar width
  const maxWidth = 500; // Maximum sidebar width
  const resizeRef = useRef<HTMLDivElement>(null);
  
  // Add state for screen width
  const [isMobile, setIsMobile] = useState(false);
  
  // Add state for active highlight
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  
  // Add state for AI panel
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiActiveTab, setAIActiveTab] = useState<string>("chat");
  
  // Add state for mobile panel height
  const [mobilePanelHeight, setMobilePanelHeight] = useState(50); // Default 50vh (half screen)
  const minPanelHeight = 25; // Minimum 25vh
  const maxPanelHeight = 90; // Maximum 90vh
  const [touchStartY, setTouchStartY] = useState(0);
  const [initialHeight, setInitialHeight] = useState(0);
  
  // Add state for delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Add state for AI panel resizing
  const [aiPanelWidth, setAiPanelWidth] = useState(400); // Increased default width for better usability
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  
  // Add state for TTS player visibility
  const [showTTSPlayer, setShowTTSPlayer] = useState(false);
  
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

  // Load saved AI panel width from localStorage with wider constraints
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('aiPanelWidth');
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (!isNaN(width) && width >= 250 && width <= 800) {
          setAiPanelWidth(width);
        }
      }
    }
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

  // Add the handleHighlightCreated function which is referenced in the TextHighlighter component
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
    if (isMobile) return 14;
    const baseFontSize = 14;
    const minFontSize = 12;
    const maxFontSize = 16;
    const calculatedSize = baseFontSize * (sidebarWidth / 400);
    return Math.max(minFontSize, Math.min(maxFontSize, calculatedSize));
  }, [sidebarWidth, isMobile]);
  
  // Calculate line height based on font size
  const calculateLineHeight = useMemo(() => {
    return `${Math.round(calculateFontSize * 1.5)}px`;
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

  // Handle AI panel resizing
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = aiPanelWidth;
    
    // Only change the cursor on the body when actively resizing
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  }, [aiPanelWidth]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!isResizingRef.current) return;
    
    // Prevent default behavior and stop propagation
    e.preventDefault();
    e.stopPropagation();
    
    // For a left-edge resize handle, the logic is reverse of right-edge handles:
    // - When dragging left (e.clientX < startXRef.current), the panel should grow wider
    // - When dragging right (e.clientX > startXRef.current), the panel should get narrower
    
    // Calculate the movement distance
    const deltaX = e.clientX - startXRef.current;
    
    // Apply the inverse relationship: 
    // - Positive deltaX (moving right) = decrease width
    // - Negative deltaX (moving left) = increase width
    const newWidth = startWidthRef.current - deltaX;
    
    // Apply constraints - using wider min/max range
    const constrainedWidth = Math.max(250, Math.min(800, newWidth));
    
    // Directly manipulate DOM for smoother resizing
    const aiPanel = document.querySelector('[data-ai-panel="true"]');
    if (aiPanel) {
      (aiPanel as HTMLElement).style.width = `${constrainedWidth}px`;
    }
    
    // Update state (less frequently than DOM updates for performance)
    setAiPanelWidth(constrainedWidth);
  }, []);

  const stopResize = useCallback((e?: MouseEvent) => {
    if (!isResizingRef.current) return;
    
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    isResizingRef.current = false;
    
    // Reset cursor and user-select when done resizing
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    
    // Get final width directly from DOM to ensure accuracy
    const aiPanel = document.querySelector('[data-ai-panel="true"]');
    if (aiPanel) {
      const finalWidth = aiPanel.getBoundingClientRect().width;
      setAiPanelWidth(Math.round(finalWidth));
      
      // Save the width preference to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('aiPanelWidth', Math.round(finalWidth).toString());
      }
    }
  }, [handleResize]);

  // Clean up event listeners and ensure cursor is reset on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      // Reset cursor on component unmount as a safety measure
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleResize, stopResize]);

  // Toggle AI panel
  const toggleAIPanel = () => {
    setShowAIPanel(!showAIPanel);
  };

  // Toggle TTS player
  const toggleTTSPlayer = () => {
    setShowTTSPlayer(prev => !prev);
  };

  // Add function to delete article
  const deleteArticle = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // First, delete all associated highlights
      const { data: highlightsData, error: highlightsError } = await supabase
        .from("highlights")
        .delete()
        .eq("article_id", articleId)
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
      const { data: notesData, error: notesError } = await supabase
        .from("notes")
        .delete()
        .eq("article_id", articleId)
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
        .eq("article_id", articleId)
        .eq("user_id", user.id);
        
      if (tagsError) {
        console.error("Error deleting article tags:", tagsError);
        // Continue with deletion even if tags fail
      }
      
      // Finally delete the article itself
      const { error: articleError } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId)
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
      
      // Redirect to library
      router.push('/library');
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

  // Add the getTagColorClass function
  const getTagColorClass = (color: string) => {
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
    };
  };

  // Add the removeTagFromArticle function
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
      
      // Update article tags in state
      if (article && article.tags) {
        setArticle({
          ...article,
          tags: article.tags.filter(tag => tag.id !== tagId)
        });
      }
      
      toast({
        title: "Tag removed",
        description: "Tag has been removed from this article",
      });
    } catch (err) {
      console.error("Error removing tag from article:", err);
    }
  };

  // Add saveHighlight function
  const saveHighlight = async (highlightData: any) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('highlights')
        .insert({
          user_id: user.id,
          article_id: articleId,
          ...highlightData
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error creating highlight:", error);
        toast({
          title: "Error",
          description: "Failed to save highlight",
          variant: "destructive"
        });
        return null;
      }
      
      // Add the new highlight to state
      setHighlights(prev => [...prev, data]);
      
      toast({
        title: "Highlight created",
        description: "Text has been highlighted successfully",
      });
      
      return data;
    } catch (err) {
      console.error("Error saving highlight:", err);
      return null;
    }
  };

  // Add handleHighlightSelect function
  const handleHighlightSelect = (highlightId: string) => {
    setActiveHighlightId(highlightId);
    
    // Find the highlight element in the DOM
    const highlightElement = document.querySelector(
      `[data-highlight-id="${highlightId}"]`
    );

    if (highlightElement) {
      // Clear any existing highlight effects
      const existingHighlights = document.querySelectorAll(".highlight-pulse");
      existingHighlights.forEach(el => {
        el.classList.remove("highlight-pulse");
      });
      
      // Scroll to the highlight
      highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Apply a highlight effect
      highlightElement.classList.add("highlight-pulse");
    }
  };

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Replace the old Left Vertical Toolbar with our new component */}
      <ArticleToolbar 
        articleId={articleId} 
        articleUrl={article?.url} 
        onDeleteClick={() => setShowDeleteDialog(true)}
        onPlayClick={toggleTTSPlayer}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-4xl mx-auto p-4 sm:p-6">
          {/* Article Header */}
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-4">
              {article.author && <span>By {article.author}</span>}
              {article.published_date && (
                <span className="flex items-center">
                  <span className="mx-2">•</span>
                  {format(new Date(article.published_date), "MMM d, yyyy")}
                </span>
              )}
              {article.estimated_read_time && (
                <span className="flex items-center">
                  <span className="mx-2">•</span>
                  {article.estimated_read_time} min read
                </span>
              )}
            </div>
            
            {/* Simplified Tag Selection */}
            <TagSelector articleId={articleId} />
          </div>

          {/* Featured Image */}
          {imageUrl && (
            <div className="mb-8 relative rounded-lg overflow-hidden">
              <div className="aspect-w-16 aspect-h-9">
                <Image
                  src={imageUrl}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}

          {/* Article Content */}
          <div className="prose dark:prose-invert max-w-none mb-20">
            <article
              className="prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
            <TextHighlighter
              articleId={articleId}
              onHighlightCreated={handleHighlightCreated}
            />
          </div>
        </div>
      </div>

      {/* AI Chat Panel (Right Side) */}
      {showAIPanel && (
        <div 
          data-ai-panel="true"
          className="border-l bg-background flex flex-col h-screen"
          style={{ 
            position: 'fixed', 
            right: 0, 
            top: 0, 
            bottom: 0, 
            zIndex: 50,
            width: `${aiPanelWidth}px`,
            minWidth: '250px',
            maxWidth: '800px'
          }}
        >
          {/* Resize handle - improved visibility and interaction */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors flex items-center justify-center"
            style={{ 
              zIndex: 60, 
              backgroundColor: 'rgba(200, 200, 200, 0.2)'
            }}
            onMouseDown={startResize}
          >
            {/* Visual indicator for resize handle */}
            <div className="h-20 w-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
          </div>
          
          <div className="p-4 border-b flex justify-center items-center">
            <h3 className="font-semibold text-lg">Reading Buddy</h3>
            <Button variant="ghost" size="sm" className="absolute right-2" onClick={toggleAIPanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ArticleAIAssistant 
              articleId={articleId}
              content={article.content}
            />
          </div>
        </div>
      )}

      {/* AI Button - Fixed Position */}
      {!showAIPanel && (
        <Button
          className="fixed right-6 top-24 rounded-full shadow-lg"
          onClick={toggleAIPanel}
          size="icon"
          title="Open Reading Buddy"
          style={{ zIndex: 40 }}
        >
          <Bot className="h-5 w-5" />
        </Button>
      )}

      {/* TTS Player */}
      {showTTSPlayer && article && (
        <ArticleSpeechPlayer
          articleId={articleId}
          content={article.content}
          title={article.title}
          onClose={() => setShowTTSPlayer(false)}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this article? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteArticle}
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