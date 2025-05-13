"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TagColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const TAG_COLORS = [
  { name: "gray", class: "bg-gray-200 dark:bg-gray-700" },
  { name: "red", class: "bg-red-200 dark:bg-red-700" },
  { name: "orange", class: "bg-orange-200 dark:bg-orange-700" },
  { name: "amber", class: "bg-amber-200 dark:bg-amber-700" },
  { name: "yellow", class: "bg-yellow-200 dark:bg-yellow-700" },
  { name: "lime", class: "bg-lime-200 dark:bg-lime-700" },
  { name: "green", class: "bg-green-200 dark:bg-green-700" },
  { name: "emerald", class: "bg-emerald-200 dark:bg-emerald-700" },
  { name: "teal", class: "bg-teal-200 dark:bg-teal-700" },
  { name: "cyan", class: "bg-cyan-200 dark:bg-cyan-700" },
  { name: "sky", class: "bg-sky-200 dark:bg-sky-700" },
  { name: "blue", class: "bg-blue-200 dark:bg-blue-700" },
  { name: "indigo", class: "bg-indigo-200 dark:bg-indigo-700" },
  { name: "violet", class: "bg-violet-200 dark:bg-violet-700" },
  { name: "purple", class: "bg-purple-200 dark:bg-purple-700" },
  { name: "fuchsia", class: "bg-fuchsia-200 dark:bg-fuchsia-700" },
  { name: "pink", class: "bg-pink-200 dark:bg-pink-700" },
  { name: "rose", class: "bg-rose-200 dark:bg-rose-700" },
];

export function TagColorPicker({ selectedColor, onColorSelect }: TagColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {TAG_COLORS.map((color) => (
        <Button
          key={color.name}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 rounded-full p-0",
            color.class,
            selectedColor === color.name && "ring-2 ring-primary"
          )}
          title={`${color.name} color`}
          onClick={() => onColorSelect(color.name)}
        />
      ))}
    </div>
  );
} 