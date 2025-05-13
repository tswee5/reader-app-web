"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";

interface ReadingProgressTrackerProps {
  articleId: string;
  initialProgress?: number;
}

export function ReadingProgressTracker({
  articleId,
  initialProgress = 0,
}: ReadingProgressTrackerProps) {
  const { supabase } = useSupabase();
  const [progress, setProgress] = useState(initialProgress);
  const [isCompleted, setIsCompleted] = useState(false);

  // Update progress in the database (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const updateProgress = async () => {
      try {
        await supabase
          .from("articles")
          .update({
            reading_progress: progress,
            is_completed: isCompleted,
            last_read_at: new Date().toISOString(),
          })
          .eq("id", articleId);
      } catch (error) {
        console.error("Failed to update reading progress:", error);
      }
    };

    // Debounce the update to avoid too many database calls
    timeoutId = setTimeout(updateProgress, 2000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [progress, isCompleted, articleId, supabase]);

  // Calculate reading progress based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      
      // Calculate how far down the page the user has scrolled
      const scrolled = (scrollTop + windowHeight) / documentHeight;
      
      // Update progress state
      const newProgress = Math.min(Math.max(scrolled, 0), 1);
      setProgress(newProgress);
      
      // Mark as completed if user has reached the end (95% of the article)
      if (newProgress > 0.95 && !isCompleted) {
        setIsCompleted(true);
      }
    };

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);
    
    // Initial calculation
    handleScroll();
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isCompleted]);

  return null; // This component doesn't render anything visible
} 