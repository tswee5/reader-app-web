"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Globe, 
  MessageSquare, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { ConversationState, WebSnippet } from "@/lib/ai/chat-utils";
import { cn } from "@/lib/utils";

interface ConversationStateIndicatorProps {
  conversationState: ConversationState;
  isFirstMessage: boolean;
  className?: string;
}

export function ConversationStateIndicator({
  conversationState,
  isFirstMessage,
  className
}: ConversationStateIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showWebSnippets, setShowWebSnippets] = useState(false);

  const isApproachingLimit = conversationState.total_tokens > 72000; // 80% of 90K limit

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Conversation State
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Token Usage */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Token Usage</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isApproachingLimit ? "destructive" : "secondary"}
                className="text-xs"
              >
                {conversationState.total_tokens.toLocaleString()}
              </Badge>
              {isApproachingLimit && (
                <AlertTriangle className="h-3 w-3 text-destructive" />
              )}
            </div>
          </div>

          {/* Conversation Length */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Messages</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {conversationState.conversation_length}
            </Badge>
          </div>

          {/* Last Web Search */}
          {conversationState.last_web_search_at && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last Web Search</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {new Date(conversationState.last_web_search_at).toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {/* First Message Indicator */}
          {isFirstMessage && (
            <Badge variant="default" className="w-full justify-center">
              First Message - Generating Summary & Web Search
            </Badge>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <div className="space-y-4 pt-3 border-t">
              {/* Memory Summary */}
              {conversationState.memory_summary && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Memory Summary</span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                    {conversationState.memory_summary}
                  </p>
                </div>
              )}

              {/* Article Summary */}
              {conversationState.article_summary && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Article Summary</span>
                  </div>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded max-h-32 overflow-y-auto">
                    {conversationState.article_summary}
                  </p>
                </div>
              )}

              {/* Web Snippets */}
              {conversationState.web_snippets && conversationState.web_snippets.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Web Snippets</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowWebSnippets(!showWebSnippets)}
                      className="h-6 text-xs"
                    >
                      {showWebSnippets ? "Hide" : "Show"} ({conversationState.web_snippets.length})
                    </Button>
                  </div>
                  
                  {showWebSnippets && (
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {conversationState.web_snippets.map((snippet, index) => (
                          <WebSnippetCard key={index} snippet={snippet} />
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WebSnippetCard({ snippet }: { snippet: WebSnippet }) {
  return (
    <div className="bg-muted p-3 rounded border">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium line-clamp-2">{snippet.title}</h4>
        {snippet.url && (
          <a
            href={snippet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3">
        {snippet.content}
      </p>
      {snippet.relevance_score && (
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            Relevance: {Math.round(snippet.relevance_score * 100)}%
          </Badge>
        </div>
      )}
    </div>
  );
} 