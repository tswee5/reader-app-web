"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Trash2, 
  Highlighter as HighlighterIcon,
  ExternalLink,
  Play,
  Settings,
  MessageSquareText,
  Bot,
  Type,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TextFormatSettings } from "@/components/articles/text-formatting/text-format-settings";

interface ArticleToolbarProps {
  articleId: string;
  articleUrl?: string | null;
  onDeleteClick: () => void;
  onPlayClick?: () => void;
  onNotesClick?: () => void;
  onAIChatClick?: () => void;
}

export function ArticleToolbar({ 
  articleId, 
  articleUrl,
  onDeleteClick,
  onPlayClick,
  onNotesClick,
  onAIChatClick
}: ArticleToolbarProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Toggle expansion on hover or click for mobile
  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsExpanded(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    // Small delay to make sure it doesn't collapse immediately
    setTimeout(() => {
      if (!isHovered) {
        setIsExpanded(false);
      }
    }, 300);
  };

  // Helper function to ensure URL has proper format
  const getFormattedUrl = (url: string | null | undefined) => {
    if (!url) return null;
    
    // Check if the URL already includes a protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Add https:// protocol if missing
    return `https://${url}`;
  };

  return (
    <TooltipProvider>
      <div 
        className={`fixed left-4 top-1/2 transform -translate-y-1/2 z-40 transition-all duration-300 ease-in-out ${
          isExpanded ? 'translate-x-0' : 'translate-x-[-2px]'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          className={`flex flex-col items-center space-y-4 dashboard-toolbar transition-all duration-300 ease-in-out ${
            isExpanded 
              ? 'opacity-100 w-16' 
              : 'opacity-75 hover:opacity-90 w-12'
          }`}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="sidebar-item" 
                onClick={() => router.push("/library")}
              >
                <BookOpen className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Return to Library</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="sidebar-item" 
                onClick={() => {
                  const url = getFormattedUrl(articleUrl);
                  if (url) {
                    console.log("Opening original article URL:", url);
                    window.open(url, '_blank');
                  } else {
                    console.error("No valid URL available for this article");
                  }
                }}
              >
                <ExternalLink className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Open Original Link</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="sidebar-item"
                onClick={onPlayClick}
              >
                <Play className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Play Audio</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="sidebar-item" 
                onClick={onNotesClick}
              >
                <MessageSquareText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>View Notes</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="sidebar-item" 
                onClick={onAIChatClick}
              >
                <Bot className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>AI Reading Buddy</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="sidebar-item" 
                  >
                    <Type className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" className="w-auto p-0 bg-white dark:bg-gray-900 bg-opacity-100 z-[100] shadow-lg" align="start" sideOffset={40}>
                  <TextFormatSettings />
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Text Formatting</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="sidebar-item" 
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="right" className="p-4 w-64 bg-white dark:bg-gray-900 bg-opacity-100 z-[100] shadow-lg" align="start" sideOffset={40}>
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Article Settings</h3>
                    
                    <div className="border-t pt-2">
                      <h4 className="font-medium text-sm mb-1">Danger Zone</h4>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={onDeleteClick}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Article</span>
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        This will permanently remove the article from your library.
                      </p>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
} 