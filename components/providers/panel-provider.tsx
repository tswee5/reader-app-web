"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface PanelContextType {
  showNotesPanel: boolean;
  showAIPanel: boolean;
  notesPanelWidth: number;
  aiPanelWidth: number;
  setShowNotesPanel: (show: boolean) => void;
  setShowAIPanel: (show: boolean) => void;
  setNotesPanelWidth: (width: number) => void;
  setAiPanelWidth: (width: number) => void;
}

const PanelContext = createContext<PanelContextType | undefined>(undefined);

export function usePanelContext() {
  const context = useContext(PanelContext);
  if (context === undefined) {
    throw new Error("usePanelContext must be used within a PanelProvider");
  }
  return context;
}

interface PanelProviderProps {
  children: ReactNode;
}

export function PanelProvider({ children }: PanelProviderProps) {
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [notesPanelWidth, setNotesPanelWidth] = useState(400);
  const [aiPanelWidth, setAiPanelWidth] = useState(400);

  return (
    <PanelContext.Provider
      value={{
        showNotesPanel,
        showAIPanel,
        notesPanelWidth,
        aiPanelWidth,
        setShowNotesPanel,
        setShowAIPanel,
        setNotesPanelWidth,
        setAiPanelWidth,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
} 