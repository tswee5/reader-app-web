"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  initialHeight?: number; // Percentage of screen height (25-90)
  minHeight?: number; // Minimum height percentage
  maxHeight?: number; // Maximum height percentage
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  initialHeight = 50,
  minHeight = 25,
  maxHeight = 90
}: MobileBottomSheetProps) {
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset height when opening
  useEffect(() => {
    if (isOpen) {
      setHeight(initialHeight);
    }
  }, [isOpen, initialHeight]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(height);
  }, [height]);

  // Handle touch move
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;

    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const deltaY = startY - currentY; // Positive when dragging up
    const screenHeight = window.innerHeight;
    const heightChange = (deltaY / screenHeight) * 100;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + heightChange));
    
    setHeight(newHeight);
  }, [isDragging, startY, startHeight, minHeight, maxHeight]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleTouchMove, handleTouchEnd]);

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end"
      onClick={handleBackdropClick}
    >
      <div
        ref={sheetRef}
        className={cn(
          "w-full bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl transition-all duration-300 ease-out mobile-bottom-sheet",
          isDragging ? "transition-none" : ""
        )}
        style={{
          height: `${height}vh`,
          maxHeight: `${maxHeight}vh`,
          minHeight: `${minHeight}vh`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div 
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
        >
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
