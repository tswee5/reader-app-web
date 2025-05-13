"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HighlightColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const HIGHLIGHT_COLORS = [
  { name: "yellow", color: "bg-yellow-200 dark:bg-yellow-900/30" },
  { name: "green", color: "bg-green-200 dark:bg-green-900/30" },
  { name: "blue", color: "bg-blue-200 dark:bg-blue-900/30" },
  { name: "purple", color: "bg-purple-200 dark:bg-purple-900/30" },
  { name: "pink", color: "bg-pink-200 dark:bg-pink-900/30" },
];

export function HighlightColorPicker({ selectedColor, onColorSelect }: HighlightColorPickerProps) {
  return (
    <div className="flex gap-1">
      {HIGHLIGHT_COLORS.map((color) => (
        <Button
          key={color.name}
          variant="ghost"
          size="sm"
          className={cn("h-6 w-6 rounded-full p-0", {
            "ring-2 ring-primary": selectedColor === color.name,
          })}
          style={{ 
            backgroundColor: color.name === "yellow" ? "#fef08a" : 
                            color.name === "green" ? "#bbf7d0" :
                            color.name === "blue" ? "#bfdbfe" :
                            color.name === "purple" ? "#e9d5ff" :
                            color.name === "pink" ? "#fbcfe8" : undefined
          }}
          onClick={() => onColorSelect(color.name)}
        />
      ))}
    </div>
  );
} 