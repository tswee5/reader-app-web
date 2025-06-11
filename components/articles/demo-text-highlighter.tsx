"use client";

import { useEffect, useRef, useState } from "react";
import { HighlightColorPicker } from "@/components/articles/highlighting/highlight-color-picker";
import { Button } from "@/components/ui/button";
import { Bot, Edit3, MessageSquare, Palette } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useDemoSupabase } from "@/components/articles/demo-supabase-provider";
import { useDemoLimitations } from "@/components/articles/demo-limitations-provider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DemoTextHighlighterProps {
  articleId: string;
  onHighlightCreated?: () => void;
  onNotesClick?: (highlightId?: string, selectedText?: string) => void;
  onAIChatClick?: (selectedText: string) => void;
}

export function DemoTextHighlighter({ 
  articleId, 
  onHighlightCreated,
  onNotesClick,
  onAIChatClick
}: DemoTextHighlighterProps) {
  const { supabase, user } = useDemoSupabase();
  const { canUseHighlight, useHighlight } = useDemoLimitations();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [highlightColor, setHighlightColor] = useState<string>("yellow");
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
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
    
    if (!canUseHighlight()) {
      toast({
        title: "Demo Limit Reached",
        description: "You've used all 5 demo highlights. Sign up to unlock unlimited highlighting!",
        variant: "destructive",
      });
      return null;
    }
    
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
      
      // Store the highlight using the demo Supabase provider
      const result = await supabase
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
        
      if (result.error) {
        console.error("Error creating highlight:", result.error);
        toast({
          title: "Error creating highlight",
          description: result.error.message,
          variant: "destructive"
        });
        return null;
      }
      
      // Apply highlight directly using the selected range
      const success = applyHighlightDirectly(range, highlightColor, result.data.id);
      
      // Close popover
      setIsPopoverOpen(false);
      
      // Show toast
      toast({
        title: "Highlight created",
        description: "Text has been highlighted successfully",
        duration: 2000,
      });
      
      // Call callback
      setTimeout(() => {
        if (onHighlightCreated) {
          onHighlightCreated();
        }
      }, 100);
      
      return result.data;
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

  // Apply highlight directly to the current selection range
  const applyHighlightDirectly = (range: Range, color: string, id: string) => {
    try {
      // Create highlight marker
      const highlightMarker = document.createElement('mark');
      highlightMarker.className = `bg-${color}-200 dark:bg-${color}-900/30 highlight-marker`;
      highlightMarker.dataset.highlightId = id;
      
      // Try surroundContents first (simplest approach)
      try {
        const clonedRange = range.cloneRange();
        clonedRange.surroundContents(highlightMarker);
        return true;
      } catch (e) {
        console.log("Simple highlight failed, trying alternate method:", e);
      }
      
      // Method 2: Handle complex selections by extracting contents
      try {
        const fragment = range.extractContents();
        highlightMarker.appendChild(fragment);
        range.insertNode(highlightMarker);
        return true;
      } catch (error) {
        console.error("Extract contents method failed:", error);
        return false;
      }
    } catch (error) {
      console.error("Error applying highlight:", error);
      return false;
    }
  };

  // Handle clicking the "Ask AI" button
  const handleAskAI = () => {
    if (!selection || !onAIChatClick) return;
    
    const selectedText = selection.toString();
    console.log("Ask AI clicked with text:", selectedText);
    
    setIsPopoverOpen(false);
    
    setTimeout(() => {
      onAIChatClick(selectedText);
    }, 50);
  };

  // Handle clicking the "Take a note" button
  const handleTakeNote = async () => {
    if (!selection || !user || !onNotesClick) return;
    
    const selectedText = selection.toString();
    
    setIsPopoverOpen(false);
    
    try {
      const highlight = await createHighlight();
      
      if (highlight) {
        if (onHighlightCreated) {
          onHighlightCreated();
        }
        
        onNotesClick(highlight.id, selectedText);
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
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAskAI}
              title="Ask AI about this text"
              className="flex items-center gap-1"
            >
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Ask AI</span>
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTakeNote}
              title="Add note to highlight"
              className="flex items-center gap-1"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Add Note</span>
            </Button>
            
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
            
            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  title="Choose highlight color"
                  className="flex items-center gap-1"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" side="bottom" align="center">
                <HighlightColorPicker
                  selectedColor={highlightColor}
                  onColorSelect={setHighlightColor}
                  onClose={() => setShowColorPicker(false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </>
  );
} 