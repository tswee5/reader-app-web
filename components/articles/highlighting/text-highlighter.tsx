"use client";

import { useEffect, useRef, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { HighlightColorPicker } from "@/components/articles/highlighting/highlight-color-picker";
import { Button } from "@/components/ui/button";
import { InlineNoteEditor } from "@/components/articles/notes/inline-note-editor";
import { Edit3, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TextHighlighterProps {
  articleId: string;
  onHighlightCreated?: () => void;
}

export function TextHighlighter({ 
  articleId, 
  onHighlightCreated
}: TextHighlighterProps) {
  const { supabase, user } = useSupabase();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [highlightColor, setHighlightColor] = useState<string>("yellow");
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // New state for inline note editor
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<{
    id: string;
    text: string;
  } | null>(null);

  // Handle text selection
  useEffect(() => {
    const handleSelectionChange = () => {
      const currentSelection = window.getSelection();
      
      if (
        currentSelection && 
        !currentSelection.isCollapsed && 
        currentSelection.rangeCount > 0
      ) {
        setSelection(currentSelection);
        
        // Get position for the popover
        const range = currentSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setPopoverPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10, // Position above the selection
        });
        
        setIsPopoverOpen(true);
      } else if (
        currentSelection && 
        currentSelection.isCollapsed && 
        !isClickInPopover(popoverRef.current)
      ) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mouseup", handleSelectionChange);
    
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mouseup", handleSelectionChange);
    };
  }, []);

  // Check if click is within popover (to prevent closing when selecting color)
  const isClickInPopover = (popoverElement: HTMLDivElement | null): boolean => {
    if (!popoverElement) return false;
    
    const selection = window.getSelection();
    if (!selection) return false;
    
    const node = selection.anchorNode;
    return popoverElement.contains(node as Node);
  };

  const createHighlight = async () => {
    if (!selection || !user) return;
    
    try {
      const range = selection.getRangeAt(0);
      const content = range.toString();
      
      // Calculate position within the article content
      const articleElement = document.querySelector('article');
      if (!articleElement) return;
      
      // Get text content up to the start of selection
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(articleElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startPos = preSelectionRange.toString().length;
      
      // Store the highlight in Supabase
      const { data, error } = await supabase
        .from('highlights')
        .insert({
          user_id: user.id,
          article_id: articleId,
          content,
          text_position_start: startPos,
          text_position_end: startPos + content.length,
          color: highlightColor
        })
        .select()
        .single();
        
      if (error) {
        console.error("Error creating highlight:", error);
        toast({
          title: "Error creating highlight",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }
      
      // First apply highlight directly using the selected range
      // This is the most reliable method when we have the actual selection
      const success = applyHighlightDirectly(range, highlightColor, data.id);
      
      // Close popover
      setIsPopoverOpen(false);
      
      // Show simple toast without affecting DOM
      toast({
        title: "Highlight created",
        description: "Text has been highlighted successfully",
        duration: 2000, // Shorter duration to avoid conflicts
      });
      
      // Call callback in next tick to allow DOM to settle
      setTimeout(() => {
        // Call callback if provided
        if (onHighlightCreated) {
          onHighlightCreated();
        }
      }, 100);
      
      return data; // Return the created highlight
    } catch (error) {
      console.error("Error in highlight creation:", error);
      toast({
        title: "Error",
        description: "Failed to create highlight",
        variant: "destructive"
      });
      return null;
    }
  };

  // New function to apply highlight directly to the current selection range
  const applyHighlightDirectly = (range: Range, color: string, id: string) => {
    try {
      // Create highlight marker
      const highlightMarker = document.createElement('mark');
      highlightMarker.className = `bg-${color}-200 dark:bg-${color}-900/30 highlight-marker`;
      highlightMarker.dataset.highlightId = id;
      
      // Method 1: Try surroundContents first (simplest approach)
      try {
        // Clone the range to avoid modifying the original selection
        const clonedRange = range.cloneRange();
        clonedRange.surroundContents(highlightMarker);
        return true;
      } catch (e) {
        console.log("Simple highlight failed, trying alternate method:", e);
        // Continue to method 2 if surroundContents fails
      }
      
      // Method 2: Handle complex selections by extracting contents
      try {
        const fragment = range.extractContents();
        highlightMarker.appendChild(fragment);
        range.insertNode(highlightMarker);
        return true;
      } catch (error) {
        console.error("Extract contents method failed:", error);
        // Continue to method 3
      }
      
      // Method 3: Fallback to the original position-based approach
      // Calculate the absolute positions
      const articleElement = document.querySelector('article');
      if (!articleElement) return false;
      
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(articleElement);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const startPos = preSelectionRange.toString().length;
      const endPos = startPos + range.toString().length;
      
      return applyHighlight(startPos, endPos, color, id);
    } catch (error) {
      console.error("All highlight methods failed:", error);
      return false;
    }
  };

  // Original position-based highlight method as fallback
  const applyHighlight = (start: number, end: number, color: string, id: string) => {
    const articleElement = document.querySelector('article');
    if (!articleElement) return;
    
    // Try to find existing highlight markers and remove them first
    const existingMarkers = articleElement.querySelectorAll(`[data-highlight-id="${id}"]`);
    existingMarkers.forEach(marker => {
      const parent = marker.parentNode;
      if (parent) {
        // Replace marker with its text content
        parent.replaceChild(document.createTextNode(marker.textContent || ""), marker);
        // Normalize to merge adjacent text nodes
        parent.normalize();
      }
    });
    
    // Create a marker for the highlight with a data attribute for the ID
    const highlightMarker = document.createElement('mark');
    highlightMarker.className = `bg-${color}-200 dark:bg-${color}-900/30 highlight-marker`;
    highlightMarker.dataset.highlightId = id;
    
    // Get all text nodes
    const textNodes = getTextNodesIn(articleElement);
    let currentPos = 0;
    let highlightApplied = false;
    
    // Track which nodes and offsets are part of the highlight
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
      if (nodeEndPos > start && nodeStartPos < end) {
        // Calculate highlight start and end offsets within this node
        const startOffset = Math.max(0, start - nodeStartPos);
        const endOffset = Math.min(nodeTextLength, end - nodeStartPos);
        
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
        
        const clone = highlightMarker.cloneNode(false);
        range.surroundContents(clone);
        highlightApplied = true;
      } catch (err) {
        console.error("Error applying highlight to node:", err);
      }
    }
    
    return highlightApplied;
  };

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

  // Handle clicking the "Take a note" button
  const handleTakeNote = async () => {
    if (!selection || !user) return;
    
    // Close the selection popover
    setIsPopoverOpen(false);
    
    // Store a reference to the current selection range
    const selectionRange = selection.getRangeAt(0).cloneRange();
    const selectedText = selectionRange.toString();
    
    try {
      // Create a highlight first with our stored range
      const highlight = await createHighlight();
      
      if (highlight) {
        // Set the active highlight and open the note editor
        setActiveHighlight({
          id: highlight.id,
          text: highlight.content,
        });
        
        // Open the inline note editor
        setIsNoteEditorOpen(true);
        
        // Apply highlight again after a short delay to ensure it's visible
        // This is a redundancy measure to handle cases where DOM updates remove the highlight
        setTimeout(() => {
          const articleElement = document.querySelector('article');
          if (!articleElement) return;
          
          // Check if highlight exists in DOM
          const existingHighlight = articleElement.querySelector(`[data-highlight-id="${highlight.id}"]`);
          if (!existingHighlight) {
            // If not found, apply the highlight again using position-based method
            applyHighlight(
              highlight.text_position_start,
              highlight.text_position_end, 
              highlight.color, 
              highlight.id
            );
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error in take note flow:", error);
      toast({
        title: "Error",
        description: "Failed to create highlight for note",
        variant: "destructive",
      });
    }
  };

  // Handle note saved callback
  const handleNoteSaved = () => {
    // Get the current active highlight ID before clearing it
    const currentHighlightId = activeHighlight?.id;
    
    // Clear active highlight
    setActiveHighlight(null);
    setIsNoteEditorOpen(false);
    
    // Ensure the highlight remains visible after the note is saved
    if (currentHighlightId) {
      setTimeout(() => {
        const articleElement = document.querySelector('article');
        if (!articleElement) return;
        
        // Check if highlight exists in DOM
        const existingHighlight = articleElement.querySelector(`[data-highlight-id="${currentHighlightId}"]`);
        if (!existingHighlight) {
          // If the highlight was somehow removed, refresh highlights from the server
          if (onHighlightCreated) {
            onHighlightCreated();
          }
        }
      }, 100);
    }
  };

  // Close the note editor
  const closeNoteEditor = () => {
    // Get the current active highlight ID before clearing it
    const currentHighlightId = activeHighlight?.id;
    
    // Clear state
    setIsNoteEditorOpen(false);
    setActiveHighlight(null);
    
    // Ensure highlight remains visible
    if (currentHighlightId) {
      setTimeout(() => {
        const articleElement = document.querySelector('article');
        if (!articleElement) return;
        
        // Check if highlight exists in DOM
        const existingHighlight = articleElement.querySelector(`[data-highlight-id="${currentHighlightId}"]`);
        if (!existingHighlight) {
          // If the highlight was somehow removed, refresh highlights from the server
          if (onHighlightCreated) {
            onHighlightCreated();
          }
        }
      }, 100);
    }
  };

  return (
    <>
      {isPopoverOpen && selection && !selection.isCollapsed && (
        <div
          ref={popoverRef}
          className="fixed z-50"
          style={{
            left: `${popoverPosition.x}px`,
            top: `${popoverPosition.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-center gap-2 rounded-md border bg-background p-2 shadow-md">
            <HighlightColorPicker 
              selectedColor={highlightColor} 
              onColorSelect={setHighlightColor} 
            />
            
            <Button
              size="sm"
              variant="ghost"
              onClick={createHighlight}
              title="Highlight text"
              className="flex items-center gap-1"
            >
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">Highlight</span>
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={handleTakeNote}
              title="Add note to highlight"
              className="flex items-center gap-1 bg-black text-white hover:bg-gray-800"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Take a note</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Inline Note Editor */}
      {isNoteEditorOpen && activeHighlight && (
        <InlineNoteEditor
          articleId={articleId}
          highlightId={activeHighlight.id}
          highlightedText={activeHighlight.text || ""}
          position={popoverPosition}
          onClose={closeNoteEditor}
          onSaved={handleNoteSaved}
        />
      )}
    </>
  );
} 