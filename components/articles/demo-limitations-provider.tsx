"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useToast } from "@/components/ui/use-toast";

interface DemoLimitations {
  highlightsUsed: number;
  aiSearchesUsed: number;
  maxHighlights: number;
  maxAiSearches: number;
}

interface DemoLimitationsContextType {
  limitations: DemoLimitations;
  canUseHighlight: () => boolean;
  canUseAiSearch: () => boolean;
  useHighlight: () => boolean;
  useAiSearch: () => boolean;
  getRemainingHighlights: () => number;
  getRemainingAiSearches: () => number;
}

const DemoLimitationsContext = createContext<DemoLimitationsContextType | undefined>(undefined);

interface DemoLimitationsProviderProps {
  children: ReactNode;
}

export function DemoLimitationsProvider({ children }: DemoLimitationsProviderProps) {
  const { toast } = useToast();
  const [limitations, setLimitations] = useState<DemoLimitations>({
    highlightsUsed: 0,
    aiSearchesUsed: 0,
    maxHighlights: 5,
    maxAiSearches: 5,
  });

  const canUseHighlight = () => limitations.highlightsUsed < limitations.maxHighlights;
  const canUseAiSearch = () => limitations.aiSearchesUsed < limitations.maxAiSearches;

  const useHighlight = () => {
    if (!canUseHighlight()) {
      toast({
        title: "Highlight Limit Reached",
        description: "You've used all 5 demo highlights. Sign up to highlight unlimited content!",
        variant: "destructive",
      });
      return false;
    }

    setLimitations(prev => ({
      ...prev,
      highlightsUsed: prev.highlightsUsed + 1,
    }));

    // Show warning when approaching limit
    if (limitations.highlightsUsed + 1 === limitations.maxHighlights - 1) {
      toast({
        title: "1 Highlight Remaining",
        description: "Sign up to unlock unlimited highlighting!",
      });
    }

    return true;
  };

  const useAiSearch = () => {
    if (!canUseAiSearch()) {
      toast({
        title: "AI Search Limit Reached",
        description: "You've used all 5 demo AI searches. Sign up to unlock unlimited AI assistance!",
        variant: "destructive",
      });
      return false;
    }

    setLimitations(prev => ({
      ...prev,
      aiSearchesUsed: prev.aiSearchesUsed + 1,
    }));

    // Show warning when approaching limit
    if (limitations.aiSearchesUsed + 1 === limitations.maxAiSearches - 1) {
      toast({
        title: "1 AI Search Remaining",
        description: "Sign up to unlock unlimited AI assistance!",
      });
    }

    return true;
  };

  const getRemainingHighlights = () => limitations.maxHighlights - limitations.highlightsUsed;
  const getRemainingAiSearches = () => limitations.maxAiSearches - limitations.aiSearchesUsed;

  const value: DemoLimitationsContextType = {
    limitations,
    canUseHighlight,
    canUseAiSearch,
    useHighlight,
    useAiSearch,
    getRemainingHighlights,
    getRemainingAiSearches,
  };

  return (
    <DemoLimitationsContext.Provider value={value}>
      {children}
    </DemoLimitationsContext.Provider>
  );
}

export function useDemoLimitations() {
  const context = useContext(DemoLimitationsContext);
  if (context === undefined) {
    throw new Error("useDemoLimitations must be used within a DemoLimitationsProvider");
  }
  return context;
} 