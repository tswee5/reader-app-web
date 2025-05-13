"use client";

import { useState, useRef, useEffect } from "react";
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
import { Bot, Send, Sparkles, ChevronDown, MessageSquare, FileText, Lightbulb, SendHorizontal, User, RefreshCw } from "lucide-react";
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

// Types
type Conversation = {
  id: string;
  title: string;
  created_at: string;
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

interface ArticleAIAssistantProps {
  articleId: string;
  content: string;
}

export function ArticleAIAssistant({ articleId, content }: ArticleAIAssistantProps) {
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch conversations when the dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchConversations();
    }
  }, [isOpen]);

  // Fetch messages when an active conversation is selected
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch(`/api/ai/conversations?articleId=${articleId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load conversations");
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      
      // If there are conversations and none is selected, select the first one
      if (data.conversations?.length > 0 && !activeConversationId) {
        setActiveConversationId(data.conversations[0].id);
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
        throw new Error("Failed to create conversation");
      }
      
      const data = await response.json();
      setConversations([data.conversation, ...conversations]);
      setActiveConversationId(data.conversation.id);
      return data.conversation.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: "Failed to create a new conversation",
        variant: "destructive",
      });
      return null;
    }
  };

  // Submit a message to Claude AI
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue.trim();
    setInputValue("");
    
    // Create a properly typed user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
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

      // Filter out any system messages as they're now handled at the top level in the API
      // Also ensure all messages have proper content and formatting
      const conversationHistory = messages
        .filter(m => (m.role === "user" || m.role === "assistant") && m.content && m.content.trim() !== '')
        .map(m => ({ 
          role: m.role, 
          content: typeof m.content === 'string' ? m.content.trim() : String(m.content).trim() 
        }));

      console.log('Sending conversation history:', conversationHistory);

      // Ensure all messages have proper content field
      const validatedMessages = conversationHistory.filter(msg => {
        return msg && 
               typeof msg === 'object' && 
               msg.role && 
               (msg.role === 'user' || msg.role === 'assistant') &&
               msg.content && 
               typeof msg.content === 'string' && 
               msg.content.trim() !== '';
      }).map(msg => ({
        role: msg.role,
        content: msg.content.trim()
      }));

      console.log('Sending validated conversation history:', validatedMessages);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          article: { content: truncatedContent, id: articleId },
          currentMessage: userMessage,
          conversationHistory: validatedMessages,
        }),
      });

      if (!response.ok) {
        // Try to extract detailed error information
        let errorMessage = "Failed to get response";
        try {
          const errorData = await response.json();
          console.error("API error details:", errorData);
          
          if (errorData.error) {
            errorMessage = errorData.error;
          }
          if (errorData.details) {
            errorMessage += `: ${errorData.details}`;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate response data
      if (!data || !data.answer) {
        console.error("Invalid response format:", data);
        throw new Error("Received invalid response format from API");
      }

      // Create a properly typed assistant message
      const newAssistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: data.answer,
        created_at: new Date().toISOString()
      };
      
      // Add AI response to the chat
      setMessages(prev => [...prev, newAssistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      
      // Create a properly typed error message with detailed information
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : "Unknown error occurred"}. Please try again.`,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus the textarea after response
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  // Handle form submission
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const clearConversation = () => {
    setMessages([]);
    setInputValue("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bot className="h-4 w-4" />
          <span>AI Assistant</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center">
            <Bot className="mr-2 h-5 w-5" />
            AI Assistant
          </DialogTitle>
          <DialogDescription>
            Ask questions about the article
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex min-h-0">
          {/* Sidebar with conversations */}
          <div className="w-[250px] border-r flex flex-col">
            <div className="p-3 border-b">
              <Button 
                variant="default" 
                className="w-full justify-start gap-2" 
                onClick={() => {
                  createNewConversation();
                }}
              >
                <MessageSquare className="h-4 w-4" />
                New Conversation
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              {isLoadingConversations ? (
                <div className="flex justify-center items-center h-20">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
                </div>
              ) : (
                conversations.length === 0 ? (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    No conversations yet
                  </div>
                ) : (
                  <div className="py-2">
                    {conversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        className={cn(
                          "flex flex-col w-full text-left px-3 py-2 hover:bg-accent rounded-none transition-colors",
                          activeConversationId === conversation.id && "bg-accent"
                        )}
                        onClick={() => setActiveConversationId(conversation.id)}
                      >
                        <span className="font-medium text-sm truncate">{conversation.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(conversation.created_at)}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              )}
            </ScrollArea>
          </div>
          
          {/* Main chat area */}
          <div className="flex-1 flex flex-col">
            {/* Message list */}
            <ScrollArea 
              className="flex-1 p-4" 
              ref={scrollAreaRef as React.RefObject<HTMLDivElement>}
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <Bot className="h-8 w-8 mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    I'm your AI assistant for this article. Ask me questions about its content, request summaries of specific sections, or inquire about related topics.
                  </p>
                </div>
              ) : (
                <div className="py-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex gap-3 max-w-full",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 max-w-[85%]",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary">
                          <User className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div className="rounded-lg px-3 py-2 bg-muted">
                        <div className="flex space-x-2 items-center h-5">
                          <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            
            {/* Message input */}
            <div className="border-t p-4">
              <div className="flex w-full gap-2">
                {messages.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearConversation}
                    title="Clear conversation"
                    className="flex-shrink-0"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Textarea
                  ref={textareaRef}
                  placeholder="Ask a question about this article..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-10 resize-none"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!inputValue.trim() || isLoading}
                  onClick={sendMessage}
                  className="flex-shrink-0"
                >
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 