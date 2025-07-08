"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ExternalLink, Clock, User, Calendar, X } from "lucide-react";
import Link from "next/link";
import { ArticleToolbar } from "@/components/articles/toolbar/article-toolbar";
import { DemoTextHighlighter } from "@/components/articles/demo-text-highlighter";
import { DemoSupabaseProvider } from "@/components/articles/demo-supabase-provider";
import { ArticleAIAssistant, ArticleAIAssistantRef } from "@/components/articles/ai/article-ai-assistant";
import { DemoNotesPanel } from "@/components/articles/demo-notes-panel";
import { useDemoLimitations } from "@/components/articles/demo-limitations-provider";
import { useToast } from "@/components/ui/use-toast";

type GuestArticle = {
  id: string;
  url: string;
  title: string;
  author?: string | null;
  published_date?: string | null;
  content: string;
  excerpt?: string | null;
  lead_image_url?: string | null;
  domain: string;
  word_count: number;
  estimated_read_time: number;
  reading_progress: number;
  is_completed: boolean;
  created_at: string;
  user_id: null;
  is_demo: true;
};

interface GuestArticleDetailProps {
  article: GuestArticle;
}

// Demo types that match the real component interfaces
interface DemoHighlight {
  id: string;
  content: string;
  text_position_start: number;
  text_position_end: number;
  color: string;
  created_at: string;
  article_id: string;
  sortOrder?: number;
}

interface DemoNote {
  id: string;
  content: string;
  highlightId: string;
  highlightedText: string;
  highlightColor: string;
  createdAt: Date;
  updatedAt: Date;
  sortOrder?: number;
}

interface DemoSummary {
  id: string;
  content: string;
  dotIndex: number;
  createdAt: Date;
  updatedAt: Date;
  sortOrder?: number;
}

export function GuestArticleDetail({ article }: GuestArticleDetailProps) {
  const { toast } = useToast();
  const { 
    useHighlight, 
    useAiSearch, 
    canUseHighlight, 
    canUseAiSearch, 
    getRemainingHighlights, 
    getRemainingAiSearches 
  } = useDemoLimitations();
  
  // Panel state management (matching the real app)
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [notesPanelWidth, setNotesPanelWidth] = useState(400);
  const [aiPanelWidth, setAiPanelWidth] = useState(400);
  
  // Demo data management
  const [demoHighlights, setDemoHighlights] = useState<DemoHighlight[]>([]);
  const [demoNotes, setDemoNotes] = useState<DemoNote[]>([]);
  const [demoSummaries, setDemoSummaries] = useState<DemoSummary[]>([]);
  
  // UI state
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("notes");
  const [pendingNoteData, setPendingNoteData] = useState<{
    highlightId: string;
    selectedText: string;
  } | null>(null);
  const [pendingSummaryData, setPendingSummaryData] = useState<{
    dotIndex: number;
    articleId?: string;
    totalDots?: number;
  } | null>(null);
  
  // Panel resizing state
  const isResizingNotesRef = useRef(false);
  const isResizingAIRef = useRef(false);
  const startXNotesRef = useRef(0);
  const startXAIRef = useRef(0);
  const startWidthNotesRef = useRef(0);
  const startWidthAIRef = useRef(0);
  
  // AI Assistant ref
  const aiAssistantRef = useRef<ArticleAIAssistantRef>(null);

  // Load demo data from sessionStorage on mount
  useEffect(() => {
    const savedHighlights = sessionStorage.getItem(`demo-highlights-${article.id}`);
    const savedNotes = sessionStorage.getItem(`demo-notes-${article.id}`);
    const savedSummaries = sessionStorage.getItem(`demo-summaries-${article.id}`);
    
    if (savedHighlights) {
      try {
        setDemoHighlights(JSON.parse(savedHighlights));
      } catch (e) {
        console.error("Error loading demo highlights:", e);
      }
    }
    
    if (savedNotes) {
      try {
        const notes = JSON.parse(savedNotes);
        setDemoNotes(notes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        })));
      } catch (e) {
        console.error("Error loading demo notes:", e);
      }
    }
    
    if (savedSummaries) {
      try {
        const summaries = JSON.parse(savedSummaries);
        setDemoSummaries(summaries.map((summary: any) => ({
          ...summary,
          createdAt: new Date(summary.createdAt),
          updatedAt: new Date(summary.updatedAt)
        })));
      } catch (e) {
        console.error("Error loading demo summaries:", e);
      }
    }
  }, [article.id]);

  // Save demo data to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem(`demo-highlights-${article.id}`, JSON.stringify(demoHighlights));
  }, [demoHighlights, article.id]);

  useEffect(() => {
    sessionStorage.setItem(`demo-notes-${article.id}`, JSON.stringify(demoNotes));
  }, [demoNotes, article.id]);

  useEffect(() => {
    sessionStorage.setItem(`demo-summaries-${article.id}`, JSON.stringify(demoSummaries));
  }, [demoSummaries, article.id]);

  // Use proxied image if available - memoize this value
  const imageUrl = useMemo(() => 
    article?.lead_image_url 
      ? `/api/proxy?url=${encodeURIComponent(article.lead_image_url)}`
      : null,
    [article?.lead_image_url]
  );

  // Format the date if available
  const formattedDate = article.published_date 
    ? format(new Date(article.published_date), "MMMM d, yyyy")
    : null;

  // Demo highlight creation function that returns the expected format
  const createDemoHighlight = useCallback(async (content: string, startPos: number, endPos: number, color: string) => {
    if (!useHighlight()) {
      throw new Error("Highlight limit reached");
    }

    const newHighlight: DemoHighlight = {
      id: `demo-highlight-${Date.now()}-${Math.random()}`,
      content,
      text_position_start: startPos,
      text_position_end: endPos,
      color,
      created_at: new Date().toISOString(),
      article_id: article.id,
      sortOrder: demoHighlights.length
    };

    setDemoHighlights(prev => [...prev, newHighlight]);
    return { data: newHighlight, error: null };
  }, [useHighlight, demoHighlights.length, article.id]);

  // Demo user object
  const demoUser = {
    id: 'demo-user',
    email: 'demo@example.com'
  };

  // Demo note creation function
  const createDemoNote = useCallback(async (content: string, highlightId: string, highlightedText: string, highlightColor: string) => {
    const newNote: DemoNote = {
      id: `demo-note-${Date.now()}-${Math.random()}`,
      content,
      highlightId,
      highlightedText,
      highlightColor,
      createdAt: new Date(),
      updatedAt: new Date(),
      sortOrder: demoNotes.length
    };

    setDemoNotes(prev => [...prev, newNote]);
    return newNote;
  }, [demoNotes.length]);

  // Demo summary creation function
  const createDemoSummary = useCallback(async (content: string, dotIndex: number) => {
    const newSummary: DemoSummary = {
      id: `demo-summary-${Date.now()}-${Math.random()}`,
      content,
      dotIndex,
      createdAt: new Date(),
      updatedAt: new Date(),
      sortOrder: demoSummaries.length
    };

    setDemoSummaries(prev => [...prev, newSummary]);
    return newSummary;
  }, [demoSummaries.length]);

  // Demo toolbar handlers
  const handleDemoToolbarAction = useCallback((action: string) => {
    switch (action) {
      case 'library':
        window.location.href = '/';
        break;
      case 'external':
        if (article.url) {
          window.open(article.url, '_blank');
        }
        break;
      case 'play':
        toast({
          title: "Audio Feature",
          description: "Sign up to unlock text-to-speech functionality!",
        });
        break;
      case 'notes':
        toggleNotesPanel();
        break;
      case 'ai-chat':
        toggleAIPanel();
        break;
      case 'settings':
        toast({
          title: "Settings",
          description: "Sign up to access article settings and more features!",
        });
        break;
      default:
        toast({
          title: "Demo Feature",
          description: "Sign up to access this feature!",
        });
    }
  }, [article.url, toast]);

  // Panel toggle functions
  const toggleNotesPanel = useCallback((highlightId?: string, selectedText?: string) => {
    if (highlightId && selectedText) {
      // Opening for note creation
      if (showAIPanel) {
        setShowAIPanel(false);
      }
      setShowNotesPanel(true);
      setActiveTab("notes");
      setPendingNoteData({ highlightId, selectedText });
      setActiveHighlightId(highlightId);
    } else {
      // Regular toggle
      if (!showNotesPanel) {
        if (showAIPanel) {
          setShowAIPanel(false);
        }
        setShowNotesPanel(true);
      } else {
        setShowNotesPanel(false);
      }
    }
  }, [showNotesPanel, showAIPanel]);

  const toggleAIPanel = useCallback(() => {
    if (!showAIPanel) {
      if (!canUseAiSearch()) {
        toast({
          title: "AI Limit Reached",
          description: "You've used all 5 demo AI searches. Sign up to unlock unlimited AI assistance!",
          variant: "destructive",
        });
        return;
      }
      useAiSearch();
      if (showNotesPanel) {
        setShowNotesPanel(false);
      }
      setShowAIPanel(true);
    } else {
      setShowAIPanel(false);
    }
  }, [showAIPanel, showNotesPanel, canUseAiSearch, useAiSearch, toast]);

  // Handle highlight creation from TextHighlighter
  const handleHighlightCreated = useCallback(() => {
    // Refresh highlights - in demo this is managed by state
    console.log("Highlight created in demo mode");
  }, []);

  // Handle AI chat with selected text
  const handleAIWithSelectedText = useCallback((selectedText: string) => {
    if (!canUseAiSearch()) {
      toast({
        title: "AI Limit Reached",
        description: "Sign up to unlock unlimited AI assistance!",
        variant: "destructive",
      });
      return;
    }

    toggleAIPanel();
    
    // Store selected text for AI to use
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedTextForAI', selectedText);
    }
  }, [canUseAiSearch, toggleAIPanel, toast]);

  // Notes panel handlers
  const deleteDemoNote = useCallback(async (noteId: string) => {
    setDemoNotes(prev => prev.filter(note => note.id !== noteId));
    toast({
      title: "Note deleted",
      description: "Your demo note has been removed.",
    });
  }, [toast]);

  const deleteDemoHighlight = useCallback(async (highlightId: string) => {
    // Remove associated notes
    setDemoNotes(prev => prev.filter(note => note.highlightId !== highlightId));
    // Remove highlight
    setDemoHighlights(prev => prev.filter(highlight => highlight.id !== highlightId));
    
    // Remove highlight from DOM
    const highlightElements = document.querySelectorAll(`[data-highlight-id="${highlightId}"]`);
    highlightElements.forEach(element => {
      const parent = element.parentNode;
      if (parent) {
        // Replace the highlight element with its text content
        parent.replaceChild(document.createTextNode(element.textContent || ''), element);
        // Normalize the parent to merge adjacent text nodes
        parent.normalize();
      }
    });

    toast({
      title: "Highlight deleted",
      description: "Your demo highlight has been removed.",
    });
  }, [toast]);

  const deleteDemoSummary = useCallback(async (summaryId: string) => {
    setDemoSummaries(prev => prev.filter(summary => summary.id !== summaryId));
    toast({
      title: "Summary deleted",
      description: "Your demo summary has been removed.",
    });
  }, [toast]);

  const updateDemoNote = useCallback(async (noteId: string, content: string): Promise<boolean> => {
    setDemoNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, content, updatedAt: new Date() }
        : note
    ));
    toast({
      title: "Note updated",
      description: "Your demo note has been saved.",
    });
    return true;
  }, [toast]);

  const updateDemoSummary = useCallback(async (summaryId: string, content: string): Promise<boolean> => {
    setDemoSummaries(prev => prev.map(summary => 
      summary.id === summaryId 
        ? { ...summary, content, updatedAt: new Date() }
        : summary
    ));
    toast({
      title: "Summary updated",
      description: "Your demo summary has been saved.",
    });
    return true;
  }, [toast]);

  const handleHighlightSelect = useCallback((highlightId: string) => {
    setActiveHighlightId(highlightId);
    
    // Scroll to highlight
    const highlightElement = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (highlightElement) {
      highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Add visual emphasis
      const existingHighlights = document.querySelectorAll(".highlight-pulse, .highlight-black-border");
      existingHighlights.forEach(el => {
        el.classList.remove("highlight-pulse", "highlight-black-border");
      });
      
      highlightElement.classList.add("highlight-pulse", "highlight-black-border");
    }
  }, []);

  // Panel resizing functions
  const startNotesResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    isResizingNotesRef.current = true;
    startXNotesRef.current = e.clientX;
    startWidthNotesRef.current = notesPanelWidth;
    
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    const handleResize = (e: MouseEvent) => {
      if (!isResizingNotesRef.current) return;
      
      const deltaX = e.clientX - startXNotesRef.current;
      const newWidth = startWidthNotesRef.current - deltaX;
      const constrainedWidth = Math.max(300, Math.min(800, newWidth));
      
      setNotesPanelWidth(constrainedWidth);
    };
    
    const stopResize = () => {
      isResizingNotesRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  }, [notesPanelWidth]);

  const startAIResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    isResizingAIRef.current = true;
    startXAIRef.current = e.clientX;
    startWidthAIRef.current = aiPanelWidth;
    
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    
    const handleResize = (e: MouseEvent) => {
      if (!isResizingAIRef.current) return;
      
      const deltaX = e.clientX - startXAIRef.current;
      const newWidth = startWidthAIRef.current - deltaX;
      const constrainedWidth = Math.max(300, Math.min(800, newWidth));
      
      setAiPanelWidth(constrainedWidth);
    };
    
    const stopResize = () => {
      isResizingAIRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  }, [aiPanelWidth]);

  // Clear pending data functions
  const clearPendingNoteData = useCallback(() => {
    setPendingNoteData(null);
  }, []);

  const clearPendingSummaryData = useCallback(() => {
    setPendingSummaryData(null);
  }, []);

  // Handle summary dot click
  const handleSummaryClick = useCallback((dotIndex: number) => {
    setShowNotesPanel(true);
    setActiveTab("summary");
    setPendingSummaryData({ 
      dotIndex, 
      articleId: article.id,
      totalDots: Math.ceil((article?.content?.split('</p>').length || 0) / 4)
    });
  }, [article.id, article.content]);

  return (
    <DemoSupabaseProvider 
      demoUser={demoUser}
      onCreateHighlight={createDemoHighlight}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Real ArticleToolbar with demo handlers */}
        <ArticleToolbar 
          articleId={article.id} 
          articleUrl={article.url} 
          onDeleteClick={() => handleDemoToolbarAction('delete')}
          onPlayClick={() => handleDemoToolbarAction('play')}
          onNotesClick={() => handleDemoToolbarAction('notes')}
          onAIChatClick={() => handleDemoToolbarAction('ai-chat')}
        />

        {/* Main Content */}
        <div 
          className="flex-1 overflow-y-auto transition-all duration-300"
          style={{
            marginLeft: '90px',
            marginRight: showNotesPanel ? `${notesPanelWidth}px` : showAIPanel ? `${aiPanelWidth}px` : '0px'
          }}
        >
          <div className="container max-w-4xl mx-auto p-4 sm:p-6">
            {/* Article Header */}
            <div className="mb-6">
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">{article.title}</h1>
              
              {/* Article Meta Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                {article.author && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>By {article.author}</span>
                  </div>
                )}
                {formattedDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formattedDate}</span>
                  </div>
                )}
                {article.estimated_read_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{article.estimated_read_time} min read</span>
                  </div>
                )}
                {article.domain && (
                  <div className="flex items-center gap-1">
                    <ExternalLink className="h-4 w-4" />
                    <span>{article.domain}</span>
                  </div>
                )}
              </div>

              {/* Demo Tag Display */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-muted-foreground">Tags:</span>
                <span className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">
                  Demo Article
                </span>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/signup">
                    Sign up to add tags
                  </Link>
                </Button>
              </div>
            </div>

            {/* Featured Image */}
            {imageUrl && (
              <div className="mb-8 relative rounded-lg overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  <Image
                    src={imageUrl}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Article Content with Demo TextHighlighter */}
            <div className="prose dark:prose-invert max-w-none mb-12">
              <article
                className="prose-lg max-w-none dark:prose-invert"
                data-article-content="true"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
              <DemoTextHighlighter
                articleId={article.id}
                onHighlightCreated={handleHighlightCreated}
                onNotesClick={toggleNotesPanel}
                onAIChatClick={handleAIWithSelectedText}
              />
            </div>

            {/* Call-to-Action Section */}
            <div className="border-t pt-8">
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-blue-950/30 dark:to-emerald-950/30 rounded-lg p-6 sm:p-8">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">Ready to level up your reading?</h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    You just experienced our reading platform. Sign up to unlock the full power of focused learning:
                  </p>
                  
                  {/* Feature highlights */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-sm">
                    <div className="flex items-center justify-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Save & organize articles</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span>Unlimited highlights & notes</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Full AI assistance</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button size="lg" className="btn-emerald" asChild>
                      <Link href="/signup">
                        <User className="h-4 w-4 mr-2" />
                        Sign Up Free - Save This Article
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/login">Already have an account?</Link>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Join thousands of readers who are transforming how they learn and retain information
                  </p>
                </div>
              </div>
            </div>

            {/* Read Original Article Link */}
            <div className="mt-8 text-center">
              <Button variant="ghost" size="sm" asChild>
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Read Original Article
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Real AI Chat Panel with Demo Limitations */}
        {showAIPanel && (
          <div 
            data-ai-panel="true"
            className="border-l bg-background flex flex-col h-screen"
            style={{ 
              position: 'fixed', 
              right: '0px',
              top: 0, 
              bottom: 0, 
              zIndex: 50,
              width: `${aiPanelWidth}px`,
              minWidth: '300px',
              maxWidth: '800px'
            }}
          >
            {/* Resize handle */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors flex items-center justify-center"
              style={{ 
                zIndex: 60, 
                backgroundColor: 'rgba(200, 200, 200, 0.2)'
              }}
              onMouseDown={startAIResize}
            >
              <div className="h-20 w-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
            </div>
            
            <div className="p-4 border-b flex justify-center items-center">
              <h3 className="font-semibold text-lg">Reading Buddy (Demo - {getRemainingAiSearches()} uses left)</h3>
              <Button variant="ghost" size="sm" className="absolute right-2" onClick={() => setShowAIPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
                          <ArticleAIAssistant 
              ref={aiAssistantRef}
              articleId={article.id}
              content={article.content}
              articleUrl={article.url}
            />
            </div>
            
            {/* Demo upgrade prompt at bottom */}
            <div className="p-4 border-t bg-muted/30">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Enjoying the AI assistant? 
                </p>
                <Button size="sm" asChild>
                  <Link href="/signup">
                    <User className="h-4 w-4 mr-2" />
                    Sign Up for Unlimited AI
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Real Notes Panel with Demo Data */}
        {showNotesPanel && (
          <div 
            data-notes-panel="true"
            className="floating-panel flex flex-col h-screen"
            style={{ 
              position: 'fixed', 
              right: 0, 
              top: 0, 
              bottom: 0, 
              zIndex: 50,
              width: `${notesPanelWidth}px`,
              minWidth: '300px',
              maxWidth: '800px'
            }}
          >
            {/* Resize handle */}
            <div 
              className="absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors flex items-center justify-center"
              style={{ 
                zIndex: 60, 
                backgroundColor: 'rgba(200, 200, 200, 0.2)'
              }}
              onMouseDown={startNotesResize}
            >
              <div className="h-20 w-1 bg-gray-400 dark:bg-gray-600 rounded-full" />
            </div>
            
            <DemoNotesPanel
              notes={demoNotes}
              highlights={demoHighlights}
              summaries={demoSummaries}
              onClose={() => setShowNotesPanel(false)}
              onDeleteNote={deleteDemoNote}
              onDeleteHighlight={deleteDemoHighlight}
              onDeleteSummary={deleteDemoSummary}
              onHighlightClick={handleHighlightSelect}
              onUpdateNote={updateDemoNote}
              onUpdateSummary={updateDemoSummary}
              activeHighlightId={activeHighlightId}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onRefreshNotes={async () => {}} // No-op for demo
              onRefreshSummaries={async () => {}} // No-op for demo
              pendingNoteData={pendingNoteData}
              pendingSummaryData={pendingSummaryData}
              onClearPendingNoteData={clearPendingNoteData}
              onClearPendingSummaryData={clearPendingSummaryData}
            />
          </div>
        )}
      </div>
    </DemoSupabaseProvider>
  );
} 