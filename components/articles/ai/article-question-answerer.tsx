"use client"

import { useState, useRef, useEffect } from "react"
import { SendHorizontal, Bot, User, RefreshCw, MessageSquare, Send, Skeleton, RotateCw } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ArticleQuestionAnswererProps {
  articleId: string
  content: string
}

export function ArticleQuestionAnswerer({ articleId, content }: ArticleQuestionAnswererProps) {
  const { toast } = useToast();
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [answer])

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

  const askQuestion = async () => {
    if (!question.trim() || isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId,
          article: { id: articleId, content: question },
          currentMessage: question,
        }),
        credentials: "include", // Include auth cookies
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()
      
      setAnswer(data.answer)
    } catch (error) {
      console.error("Error getting AI response:", error)
      setError("Sorry, I encountered an error processing your request. Please try again.")
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
      askQuestion()
    }
  }

  const clearConversation = () => {
    setQuestion("")
    setAnswer(null)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  return (
    <Card className="shadow-sm overflow-hidden">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center">
            <MessageSquare className="mr-1 h-4 w-4" />
            Quick Questions
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="px-3 py-2">
        <div className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="Ask a specific question about this article..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="resize-none min-h-[60px] pr-12 text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={askQuestion}
              disabled={!question.trim() || isLoading}
              size="icon"
              className={`absolute bottom-2 right-2 h-8 w-8 ${!question.trim() || isLoading ? 'opacity-50' : 'opacity-100'}`}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
          
          {isLoading && (
            <div className="space-y-2 py-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex items-center justify-center mt-3">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary"></div>
              </div>
            </div>
          )}
          
          {error && !isLoading && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              <p className="font-medium">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setError(null);
                  askQuestion();
                }}
                className="w-full mt-2 h-8 text-xs"
              >
                <RotateCw className="mr-1 h-3 w-3" /> Try Again
              </Button>
            </div>
          )}
          
          {answer && !isLoading && !error && (
            <div className="rounded-md border p-3 mt-3">
              <ReactMarkdown
                className="prose prose-sm max-w-none dark:prose-invert text-sm leading-relaxed"
              >
                {answer}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 