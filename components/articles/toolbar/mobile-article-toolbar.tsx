"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Trash2, 
  Play,
  MessageSquareText,
  Bot,
  Type,
  Settings,
  ExternalLink,
  ChevronUp,
  ChevronDown
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

interface MobileArticleToolbarProps {
  articleId: string;
  articleUrl?: string | null;
  onDeleteClick: () => void;
  onPlayClick?: () => void;
  onNotesClick?: () => void;
  onAIChatClick?: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function MobileArticleToolbar({ 
  articleId, 
  articleUrl,
  onDeleteClick,
  onPlayClick,
  onNotesClick,
  onAIChatClick,
  isExpanded,
  onToggleExpanded
}: MobileArticleToolbarProps) {
  const router = useRouter();

  // Helper function to ensure URL has proper format
  const getFormattedUrl = (url: string | null | undefined) => {
    if (!url) return null;
    
    // Handle PDF URLs
    if (url.startsWith('pdf://')) {
      return null; // PDFs don't have external links
    }
    
    // Check if the URL already includes a protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Add https:// protocol if missing
    return `https://${url}`;
  };

  // Check if this is a PDF article
  const isPDF = articleUrl?.startsWith('pdf://');

  return (
    <TooltipProvider>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg mobile-toolbar">
        {/* Main toolbar */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Library and External Link */}
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-10 w-10 rounded-full"
                  onClick={() => router.push("/library")}
                >
                  <BookOpen className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-medium">
                <p>Library</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-10 w-10 rounded-full"
                  disabled={isPDF}
                  onClick={() => {
                    const url = getFormattedUrl(articleUrl);
                    if (url) {
                      window.open(url, '_blank');
                    }
                  }}
                >
                  <ExternalLink className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-medium">
                <p>{isPDF ? "PDF - No Link" : "Original"}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Center - Expand/Collapse button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full"
            onClick={onToggleExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>

          {/* Right side - Settings */}
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-10 w-10 rounded-full"
                    >
                      <Type className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="w-auto p-0 bg-white dark:bg-gray-900 bg-opacity-100 z-[100] shadow-lg">
                    <TextFormatSettings />
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent side="top" className="font-medium">
                <p>Format</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-10 w-10 rounded-full"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent side="top" className="p-4 w-64 bg-white dark:bg-gray-900 bg-opacity-100 z-[100] shadow-lg">
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
              <TooltipContent side="top" className="font-medium">
                <p>Settings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Expanded toolbar with additional actions */}
        {isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex items-center justify-around">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex flex-col items-center space-y-1 h-auto py-2 px-3"
                    onClick={onPlayClick}
                  >
                    <Play className="h-5 w-5" />
                    <span className="text-xs">Audio</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-medium">
                  <p>Play Audio</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex flex-col items-center space-y-1 h-auto py-2 px-3"
                    onClick={onNotesClick}
                  >
                    <MessageSquareText className="h-5 w-5" />
                    <span className="text-xs">Notes</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-medium">
                  <p>View Notes</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex flex-col items-center space-y-1 h-auto py-2 px-3"
                    onClick={onAIChatClick}
                  >
                    <Bot className="h-5 w-5" />
                    <span className="text-xs">AI Chat</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-medium">
                  <p>AI Reading Buddy</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
