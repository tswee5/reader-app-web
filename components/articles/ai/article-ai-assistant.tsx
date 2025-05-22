"use client";

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { useSupabase } from "@/components/providers/supabase-provider";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Sparkles, ChevronDown, MessageSquare, FileText, Lightbulb, SendHorizontal, User, RefreshCw, ZoomIn, ZoomOut, Plus, Minus, History, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

// Types
type Conversation = {
  id: string;
  title: string;
  created_at: string;
  first_message?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

// Predefined prompt templates
const promptTemplates = [
  {
    title: "Summarize",
    prompt: "Provide a concise summary of the main points from this article."
  },
  {
    title: "Key Insights",
    prompt: "What are the 3-5 most important insights or takeaways from this article?"
  },
  {
    title: "Explain Concepts",
    prompt: "Explain the following concepts mentioned in the article in simple terms: {concepts}"
  },
  {
    title: "Counterarguments",
    prompt: "What are some potential counterarguments to the main points in this article?"
  },
  {
    title: "Related Topics",
    prompt: "Suggest related topics or further reading based on this article."
  }
];

// Add a ref type for the AI assistant
export interface ArticleAIAssistantRef {
  submitQuery: (text: string) => void;
  createNewConversationWithText: (text: string) => void;
}

interface ArticleAIAssistantProps {
  articleId: string;
  content: string;
}

export const ArticleAIAssistant = forwardRef<ArticleAIAssistantRef, ArticleAIAssistantProps>(
  function ArticleAIAssistant({ articleId, content }, ref) {
    const { supabase } = useSupabase();
    const { toast } = useToast();
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [containerWidth, setContainerWidth] = useState(320);
    const [fontSize, setFontSize] = useState(() => {
      // Try to load saved font size preference from localStorage
      if (typeof window !== 'undefined') {
        const savedSize = localStorage.getItem('aiChatFontSize');
        return savedSize ? parseInt(savedSize, 10) : 16; // Default to 16px if no saved preference
      }
      return 16;
    });

    // Monitor container size changes using ResizeObserver
    useEffect(() => {
      const container = document.querySelector('[data-ai-panel="true"]');
      if (!container) return;
      
      // Set initial width
      setContainerWidth(container.clientWidth);
      
      // Create ResizeObserver to detect changes in container width
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      
      // Start observing
      resizeObserver.observe(container);
      
      // Clean up
      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Fetch conversations when component mounts
    useEffect(() => {
      fetchConversations();
      
      // Check for any stored selected text
      if (typeof window !== 'undefined') {
        const storedText = sessionStorage.getItem('selectedTextForAI');
        if (storedText) {
          console.log("Found stored selected text:", storedText);
          // Create a new conversation with the stored text
          const processStoredText = async () => {
            // Create a new conversation with a more descriptive title
            const shortText = storedText.length > 30 
              ? storedText.substring(0, 30) + "..." 
              : storedText;
              
            const newTitle = `Selection: ${shortText}`;
            const newConversationId = await createNewConversation(newTitle);
            
            if (newConversationId) {
              // Clear messages
              setMessages([]);
              setActiveConversationId(newConversationId);
              
              // Set input value to the provided text
              setInputValue(`About this text: "${storedText}"`);
              
              // Focus the textarea
              if (textareaRef.current) {
                textareaRef.current.focus();
              }
              
              // Clear the stored text
              sessionStorage.removeItem('selectedTextForAI');
            }
          };
          
          processStoredText();
        }
      }
    }, []);

    // Fetch messages when an active conversation is selected
    useEffect(() => {
      if (activeConversationId) {
        fetchMessages(activeConversationId);
      } else {
        setMessages([]);
      }
    }, [activeConversationId]);

    // Auto-scroll to the bottom when messages change
    useEffect(() => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current;
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }, [messages]);

    // Auto-resize textarea as content grows
    useEffect(() => {
      const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        
        // Reset height to ensure we get the right scrollHeight
        textarea.style.height = 'auto';
        
        // Set height based on scrollHeight, with min/max constraints
        const newHeight = Math.min(200, Math.max(100, textarea.scrollHeight));
        textarea.style.height = `${newHeight}px`;
      };
      
      // Call initially and when input value changes
      if (inputValue) {
        setTimeout(adjustTextareaHeight, 0);
      }
    }, [inputValue]);

    // Handle input change with auto-resize
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputValue(e.target.value);
    };

    // Fetch conversations
    const fetchConversations = async () => {
      try {
        setIsLoadingConversations(true);
        const response = await fetch(`/api/ai/conversations?articleId=${articleId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load conversations");
        }
        
        const data = await response.json();
        const conversationsData = data.conversations || [];
        
        // Store conversations
        setConversations(conversationsData);
        
        // If there are conversations and none is selected, select the first one
        if (conversationsData.length > 0 && !activeConversationId) {
          setActiveConversationId(conversationsData[0].id);
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error",
          description: "Failed to load AI conversations",
          variant: "destructive",
        });
      } finally {
        setIsLoadingConversations(false);
      }
    };

    // Fetch messages for a conversation
    const fetchMessages = async (conversationId: string) => {
      try {
        const response = await fetch(`/api/ai/messages?conversationId=${conversationId}`);
        
        if (!response.ok) {
          throw new Error("Failed to load messages");
        }
        
        const data = await response.json();
        setMessages(data.messages || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load conversation messages",
          variant: "destructive",
        });
      }
    };

    // Create a new conversation
    const createNewConversation = async (title: string = "New conversation") => {
      try {
        setIsLoading(true);
        
        const response = await fetch("/api/ai/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            articleId,
            title,
          }),
        });
        
        if (!response.ok) {
          // Try to get detailed error information
          let errorText = await response.text();
          let errorData;
          
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: `Status ${response.status}: ${response.statusText}` };
          }
          
          const errorMessage = errorData.error || "Failed to create conversation";
          console.error(`API error (${response.status}):`, errorData);
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
          
          return null;
        }
        
        const data = await response.json();
        setConversations([data.conversation, ...conversations]);
        setActiveConversationId(data.conversation.id);
        return data.conversation.id;
      } catch (error) {
        console.error("Error creating conversation:", error);
        toast({
          title: "Error",
          description: "Failed to create a new conversation. Check your connection.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    };

    // Submit a message to Claude AI
    const sendMessage = async (manualInput?: string) => {
      // Use either the manual input or the current input value
      const messageText = manualInput || inputValue;
      
      if (!messageText.trim() || isLoading) return;
      
      setInputValue("");
      
      // Create a properly typed user message
      const newUserMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageText.trim(),
        created_at: new Date().toISOString()
      };
      
      // Add user message to the chat
      setMessages(prev => [...prev, newUserMessage]);
      
      setIsLoading(true);
      
      try {
        // Truncate content if it's very long to avoid API limits
        const truncatedContent = content.length > 8000 
          ? content.substring(0, 8000) + "..." 
          : content;

        // Ensure we have a conversation ID
        let conversationId = activeConversationId;
        if (!conversationId) {
          conversationId = await createNewConversation();
          if (!conversationId) {
            throw new Error("Failed to create conversation");
          }
        }

        // Filter out any system messages as they're now handled at the top level in the API
        const conversationHistory = messages
          .filter(m => (m.role === "user" || m.role === "assistant") && m.content && m.content.trim() !== '')
          .map(m => ({ 
            role: m.role, 
            content: typeof m.content === 'string' ? m.content.trim() : String(m.content).trim() 
          }));

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            articleId,
            article: { content: truncatedContent, id: articleId },
            currentMessage: messageText,
            conversationHistory: conversationHistory,
            conversationId: conversationId
          }),
        });
        
        if (!response.ok) {
          // Try to get detailed error information
          let errorText = await response.text();
          let errorData;
          
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: `Status ${response.status}: ${response.statusText}` };
          }
          
          const errorMessage = errorData.error || "Failed to get AI response";
          console.error(`API error (${response.status}):`, errorData);
          
          // Add error message to the chat
          const errorMsg: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: `I'm sorry, I encountered an error: ${errorMessage}. Please try again.`,
            created_at: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, errorMsg]);
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Add AI response to the chat
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: data.answer || data.response || "I'm sorry, I couldn't generate a response.",
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error getting AI response:", error);
        
        // Only show toast if we haven't already added an error message
        if (!(error instanceof Error && error.message.includes("Failed to get AI response"))) {
          toast({
            title: "Error",
            description: "Failed to get AI response. Please check your connection.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter without Shift (unless on mobile)
      if (e.key === 'Enter' && !e.shiftKey && !isMobileDevice()) {
        e.preventDefault();
        sendMessage();
        return;
      }
      
      // Alternative: Submit on Ctrl+Enter or Cmd+Enter (works on all devices)
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendMessage();
        return;
      }
    };
    
    // Helper to detect mobile devices
    const isMobileDevice = () => {
      if (typeof window !== 'undefined') {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
      }
      return false;
    };

    // Handle predefined prompts
    const handlePredefinedPrompt = (prompt: string) => {
      if (isLoading) return;
      setInputValue(prompt);
      textareaRef.current?.focus();
    };

    // Handle font size changes
    const increaseFontSize = () => {
      const newSize = Math.min(fontSize + 2, 24); // Max font size of 24px
      setFontSize(newSize);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aiChatFontSize', newSize.toString());
      }
    };

    const decreaseFontSize = () => {
      const newSize = Math.max(fontSize - 2, 12); // Min font size of 12px
      setFontSize(newSize);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aiChatFontSize', newSize.toString());
      }
    };

    // Add startNewConversation function after decreaseFontSize
    const startNewConversation = async () => {
      if (isLoading) return;
      
      // Create a new conversation with a timestamp as title
      const newTitle = `New Chat ${new Date().toLocaleString()}`;
      const newConversationId = await createNewConversation(newTitle);
      
      if (newConversationId) {
        // Clear messages
        setMessages([]);
        setActiveConversationId(newConversationId);
        
        // Simple notification
        toast({
          title: "New conversation started",
          duration: 1500,
        });
      }
    };

    // Add state for history dialog
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);

    // Add loadConversation function to switch to a previous conversation
    const loadConversation = (conversationId: string) => {
      setActiveConversationId(conversationId);
      setShowHistoryDialog(false);
    };

    // Add function to get first message from a conversation
    const getFirstMessageForConversation = (conversationId: string): Promise<string | undefined> => {
      return new Promise(async (resolve) => {
        try {
          // Check if we already have messages for this conversation
          if (conversationId === activeConversationId && messages.length > 0) {
            const firstUserMessage = messages.find(m => m.role === "user");
            if (firstUserMessage) {
              resolve(firstUserMessage.content);
              return;
            }
          }
          
          // Otherwise fetch the first message
          const response = await fetch(`/api/ai/messages?conversationId=${conversationId}`);
          if (!response.ok) {
            resolve(undefined);
            return;
          }
          
          const data = await response.json();
          const firstUserMessage = data.messages?.find((m: Message) => m.role === "user");
          resolve(firstUserMessage?.content);
        } catch (error) {
          console.error(`Error getting first message for conversation ${conversationId}:`, error);
          resolve(undefined);
        }
      });
    };

    // Add state to track which conversation we're previewing
    const [previewConversationId, setPreviewConversationId] = useState<string | null>(null);
    const [previewMessage, setPreviewMessage] = useState<string | undefined>(undefined);

    // Preview a conversation's first message
    const previewConversation = async (conversationId: string) => {
      setPreviewConversationId(conversationId);
      const firstMessage = await getFirstMessageForConversation(conversationId);
      setPreviewMessage(firstMessage);
    };

    // Expose methods to parent components through the ref
    useImperativeHandle(ref, () => ({
      submitQuery: (text: string) => {
        setInputValue(text);
        // If you want it to immediately submit, uncomment the line below
        // sendMessage(text);
      },
      createNewConversationWithText: async (text: string) => {
        console.log("createNewConversationWithText called with:", text);
        
        // Create a new conversation with a more descriptive title based on the selected text
        const shortText = text.length > 30 
          ? text.substring(8, 38) + "..." // Skip "About this text: " prefix and limit length
          : text.substring(8); // Just skip the prefix
          
        const newTitle = `Selection: ${shortText}`;
        console.log("Creating new conversation with title:", newTitle);
        
        const newConversationId = await createNewConversation(newTitle);
        
        if (newConversationId) {
          console.log("New conversation created with ID:", newConversationId);
          // Clear messages
          setMessages([]);
          setActiveConversationId(newConversationId);
          
          // Set input value to the provided text
          setInputValue(text);
          
          // Focus the textarea
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        } else {
          console.error("Failed to create new conversation");
        }
      }
    }));

    return (
      <div className="flex flex-col h-full w-full">
        {/* Chat messages */}
        <ScrollArea 
          ref={scrollAreaRef} 
          className="flex-1 p-4 pl-5 space-y-4 overflow-y-auto"
        >
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-2" />
              <p className="text-sm text-muted-foreground mb-6">
                Ask anything about this article
              </p>
              <Button 
                className="mx-auto bg-slate-900 hover:bg-slate-800 text-white px-4"
                onClick={() => sendMessage("Summarize this article")}
                disabled={isLoading}
              >
                Generate Summary
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    "rounded-lg text-sm",
                    message.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground max-w-[80%] px-3 py-2"
                      : `bg-muted max-w-[${containerWidth > 400 ? '90' : '95'}%] px-4 py-3`
                  )}
                  style={{
                    maxWidth: message.role === "user" 
                      ? "80%" 
                      : `${Math.min(95, 90 + (5 * (containerWidth - 320) / 200))}%`,
                    marginLeft: message.role === "assistant" ? "16px" : undefined,
                    fontSize: `${fontSize}px`
                  }}
                >
                  <div className="prose-sm dark:prose-invert max-w-none" style={{ fontSize: 'inherit' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                        a: ({ node, ...props }) => <a className="text-blue-500 hover:underline" {...props} />
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div 
                  className="flex max-w-[80%] rounded-lg px-4 py-3 text-sm bg-muted" 
                  style={{ 
                    marginLeft: "16px",
                    fontSize: `${fontSize}px` 
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-75"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground delay-150"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input field */}
        <div className="p-8 pl-9 border-t mt-auto">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your question..."
              className="flex-1 min-h-[100px] ai-assistant-input"
              data-ai-input="true"
              rows={4}
              style={{ 
                resize: "vertical", 
                minHeight: "100px", 
                maxHeight: "200px" 
              }}
            />
            <Button 
              onClick={() => sendMessage()}
              size="icon" 
              className="h-10 w-10 self-end mb-1" 
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Keyboard shortcut helper */}
          <div className="mt-1 text-xs text-muted-foreground">
            <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
            <span className="sm:hidden">Press Ctrl+Enter to send</span>
          </div>
          
          {/* Font size controls and new action buttons */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-muted-foreground mr-1">Text size:</span>
              <Button 
                onClick={decreaseFontSize} 
                variant="outline" 
                size="sm" 
                className="h-6 w-6 p-0 rounded-full" 
                disabled={fontSize <= 12}
                title="Decrease font size"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="text-xs w-8 text-center">{fontSize}px</span>
              <Button 
                onClick={increaseFontSize} 
                variant="outline" 
                size="sm" 
                className="h-6 w-6 p-0 rounded-full" 
                disabled={fontSize >= 24}
                title="Increase font size"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            
            {/* New buttons for chat actions */}
            <div className="flex items-center space-x-2">
              <Button
                onClick={startNewConversation}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                title="Start a new conversation"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => setShowHistoryDialog(true)}
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 rounded-full"
                title="View conversation history"
                disabled={isLoading || conversations.length <= 1}
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Dialog for conversation history */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Conversation History</DialogTitle>
              <DialogDescription>
                Select a previous conversation to continue
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {isLoadingConversations ? (
                <div className="flex justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
                </div>
              ) : conversations.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No previous conversations found
                </p>
              ) : (
                <ScrollArea className="h-[40vh] pr-4">
                  <div className="space-y-2">
                    {conversations.map((conversation) => (
                      <Button
                        key={conversation.id}
                        variant={conversation.id === activeConversationId ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => loadConversation(conversation.id)}
                        onMouseEnter={() => previewConversation(conversation.id)}
                      >
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium truncate w-full">
                            {conversation.title || "Unnamed conversation"}
                          </span>
                          {previewConversationId === conversation.id && previewMessage && (
                            <span className="text-xs text-muted-foreground truncate w-full mt-1">
                              &quot;{previewMessage.length > 60 
                                ? previewMessage.substring(0, 60) + "..." 
                                : previewMessage}&quot;
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground mt-1">
                            {new Date(conversation.created_at).toLocaleString()}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
); 