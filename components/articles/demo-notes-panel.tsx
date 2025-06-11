"use client";

import { NotesPanel } from "@/components/articles/notes/notes-panel";
import { Button } from "@/components/ui/button";
import { User, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

interface DemoNotesPanelProps {
  notes: any[];
  highlights: any[];
  summaries: any[];
  onClose: () => void;
  onDeleteNote: (noteId: string) => Promise<void>;
  onDeleteHighlight: (highlightId: string) => Promise<void>;
  onDeleteSummary: (summaryId: string) => Promise<void>;
  onHighlightClick: (highlightId: string) => void;
  onUpdateNote: (noteId: string, content: string) => Promise<boolean>;
  onUpdateSummary: (summaryId: string, content: string) => Promise<boolean>;
  activeHighlightId: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onRefreshNotes?: () => Promise<void>;
  onRefreshSummaries?: () => Promise<void>;
  pendingNoteData?: {
    highlightId: string;
    selectedText: string;
  } | null;
  pendingSummaryData?: {
    dotIndex: number;
    articleId?: string;
    totalDots?: number;
  } | null;
  onClearPendingNoteData?: () => void;
  onClearPendingSummaryData?: () => void;
}

export function DemoNotesPanel(props: DemoNotesPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Demo Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-lg">Notes & Highlights (Demo)</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={props.onClose}>
            ✕
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Experience our full note-taking system
        </p>
      </div>
      
      {/* Main Notes Panel */}
      <div className="flex-1 overflow-hidden relative">
        <NotesPanel {...props} />
        
        {/* Demo overlay when no content */}
        {props.notes.length === 0 && props.highlights.length === 0 && props.summaries.length === 0 && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center p-6 max-w-md">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-semibold text-lg mb-2">Start Building Your Knowledge</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Highlight text and take notes to see them organized here. Try selecting some text in the article!
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span>Unlimited highlights & notes</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>Automatic syncing & backup</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>AI-powered summaries</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Demo Footer */}
      <div className="p-4 border-t bg-muted/30">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            {props.notes.length > 0 || props.highlights.length > 0 
              ? "Great job! This is how your notes look in the real app." 
              : "Ready to save your insights permanently?"
            }
          </p>
          <Button size="sm" className="w-full" asChild>
            <Link href="/signup">
              <User className="h-4 w-4 mr-2" />
              Sign Up to Keep Your Notes Forever
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 