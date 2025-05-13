"use client"

import { useState, useRef, useEffect } from "react"
import { SendHorizontal, Bot, User, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ArticleQuestionAnswererProps {
  articleId: string
  content: string
}

export function ArticleQuestionAnswerer({ articleId, content }: ArticleQuestionAnswererProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Attempt to refresh the session on auth errors
  const trySessionRefresh = async (): Promise<boolean> => {
    try {
      console.log('Attempting to refresh session for question answerer...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        return false;
      }
      
      if (data.session) {
        console.log('Session successfully refreshed');
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('Error during session refresh:', e);
      return false;
    }
  };

  const sendMessage = async (retryCount = 0) => {
    if (!inputValue.trim() || isLoading) return
    
    const userMessage = inputValue.trim()
    setInputValue("")
    
    // Add user message to the chat
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    
    setIsLoading(true)
    
    try {
      // Truncate content if it's very long to avoid API limits
      const truncatedContent = content.length > 8000 
        ? content.substring(0, 8000) + "..." 
        : content

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          article: { id: articleId, content: truncatedContent },
          currentMessage: userMessage,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
        }),
        credentials: "include", // Include auth cookies
      })

      if (!response.ok) {
        // If we got a 401 auth error and haven't retried too many times
        if (response.status === 401 && retryCount < 2) {
          console.log(`Auth error in AI chat API, attempt ${retryCount + 1} to refresh session`);
          
          // Try to refresh the session
          const refreshSuccessful = await trySessionRefresh();
          
          if (refreshSuccessful) {
            // If refresh succeeded, wait a moment and retry
            console.log("Session refresh successful, retrying AI chat request");
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsLoading(false);
            return sendMessage(retryCount + 1);
          }
        }
        
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      
      // Add AI response to the chat
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }])
    } catch (error) {
      console.error("Error getting AI response:", error)
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          content: "Sorry, I encountered an error processing your request. Please try again." 
        }
      ])
    } finally {
      setIsLoading(false)
      // Focus the textarea after response
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(0)
    }
  }

  const clearConversation = () => {
    setMessages([])
    setInputValue("")
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  return (
    <Card className="flex flex-col h-[200px] shadow-sm">
      <CardHeader className="pb-1 pt-2 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <Bot className="mr-1 h-4 w-4" />
            Article Q&A
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Ask questions about this article and get AI-powered answers
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-hidden p-0 flex flex-col">
        <ScrollArea 
          className="flex-grow px-3 pb-1" 
          ref={scrollAreaRef as React.RefObject<HTMLDivElement>}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-2">
              <Bot className="h-8 w-8 text-slate-400" />
              <p className="text-xs text-slate-500 mt-1">
                Ask me anything about the article
              </p>
            </div>
          ) : (
            <div className="py-2 space-y-4">
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
        
        {/* Input area moved inside CardContent to be part of the same flex container */}
        <div className="flex w-full gap-2 p-1 px-2 mt-auto border-t bg-gray-50">
          {messages.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearConversation}
              title="Clear conversation"
              className="flex-shrink-0 h-8 w-8"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          )}
          <Textarea
            ref={textareaRef}
            placeholder="Ask a question about this article..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-8 resize-none text-sm py-1"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isLoading}
            onClick={() => sendMessage(0)}
            className="flex-shrink-0 h-8 w-8"
          >
            <SendHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 