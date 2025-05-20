"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Trash2, 
  Highlighter as HighlighterIcon,
  ExternalLink,
  Play,
  Tag,
  Settings,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ArticleToolbarProps {
  articleId: string;
  articleUrl?: string | null;
  onDeleteClick: () => void;
  onPlayClick?: () => void;
}

export function ArticleToolbar({ 
  articleId, 
  articleUrl,
  onDeleteClick,
  onPlayClick
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
          className={`flex flex-col items-center space-y-6 py-6 px-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-md transition-all duration-300 ease-in-out ${
            isExpanded 
              ? 'opacity-100 w-16' 
              : 'opacity-75 hover:opacity-90 w-12'
          }`}
          style={{
            boxShadow: isExpanded 
              ? '0 4px 12px rgba(0, 0, 0, 0.1)' 
              : '0 2px 6px rgba(0, 0, 0, 0.07)'
          }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" 
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
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" 
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
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
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
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" 
              >
                <Tag className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Manage Tags</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" 
              >
                <Eye className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>View Options</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" 
              >
                <HighlighterIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Highlight Text</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" 
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>

          <div className="mt-4 pt-4 border-t border-muted w-full flex justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-red-100 dark:hover:bg-red-900" 
                  onClick={onDeleteClick}
                >
                  <Trash2 className="h-5 w-5 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                <p>Delete Article</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
} 