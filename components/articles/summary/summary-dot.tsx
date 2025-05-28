"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Circle, CheckCircle } from "lucide-react";

interface SummaryDotProps {
  dotIndex: number;
  totalDots: number;
  isCompleted: boolean;
  onClick: (dotIndex: number) => void;
  className?: string;
}

export function SummaryDot({ 
  dotIndex, 
  totalDots, 
  isCompleted, 
  onClick, 
  className = "" 
}: SummaryDotProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getPromptText = () => {
    if (dotIndex === 0) {
      return "Summarize what you've read so far";
    } else if (dotIndex === totalDots - 1) {
      return "Summarize the key points from the entire article";
    } else {
      return "Summarize what you've read since your last checkpoint";
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-110 ${
          isCompleted 
            ? 'text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30' 
            : 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30'
        }`}
        onClick={() => onClick(dotIndex)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={getPromptText()}
      >
        {isCompleted ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </Button>
      
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg whitespace-nowrap z-50 shadow-lg">
          {getPromptText()}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
        </div>
      )}
    </div>
  );
} 