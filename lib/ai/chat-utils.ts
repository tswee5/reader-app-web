/**
 * Utility functions for enhanced stateful AI chat system
 */

export interface WebSnippet {
  title: string;
  content: string;
  url?: string;
  relevance_score?: number;
}

export interface ConversationState {
  article_summary?: string;
  web_snippets?: WebSnippet[];
  memory_summary?: string;
  total_tokens: number;
  conversation_length: number;
  last_web_search_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

/**
 * Estimate token count for text content
 * Rough estimation: 1 token ≈ 4 characters
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate total tokens for a conversation including system prompts
 */
export function estimateConversationTokens(
  messages: ChatMessage[],
  systemPrompt: string,
  articleSummary?: string,
  webSnippets?: WebSnippet[],
  memorySummary?: string
): number {
  let total = estimateTokens(systemPrompt);
  
  // Add article summary tokens
  if (articleSummary) {
    total += estimateTokens(articleSummary);
  }
  
  // Add web snippets tokens
  if (webSnippets) {
    const snippetsText = webSnippets
      .map(snippet => `${snippet.title}: ${snippet.content}`)
      .join('\n\n');
    total += estimateTokens(snippetsText);
  }
  
  // Add memory summary tokens
  if (memorySummary) {
    total += estimateTokens(memorySummary);
  }
  
  // Add message tokens
  for (const message of messages) {
    total += estimateTokens(message.content);
  }
  
  return total;
}

/**
 * Check if a user message requires web search
 * Looks for keywords that indicate need for current/external information
 */
export function requiresWebSearch(message: string): boolean {
  const webSearchKeywords = [
    'recent', 'latest', 'current', 'today', 'yesterday', 'this week', 'this month',
    'news', 'update', 'announcement', 'release', 'new', 'latest version',
    'statistics', 'stats', 'data', 'numbers', 'figures', 'trends',
    'compare', 'versus', 'vs', 'difference between',
    'what happened', 'when did', 'how many', 'how much',
    'price', 'cost', 'market', 'stock', 'crypto', 'bitcoin',
    'election', 'politics', 'government', 'policy',
    'weather', 'forecast', 'temperature',
    'covid', 'pandemic', 'virus', 'vaccine'
  ];
  
  const lowerMessage = message.toLowerCase();
  return webSearchKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Check if web search should be performed based on time constraints
 * Prevents excessive web searches (max once per 5 minutes)
 */
export function shouldPerformWebSearch(lastWebSearchAt?: string): boolean {
  if (!lastWebSearchAt) return true;
  
  const lastSearch = new Date(lastWebSearchAt);
  const now = new Date();
  const minutesSinceLastSearch = (now.getTime() - lastSearch.getTime()) / (1000 * 60);
  
  return minutesSinceLastSearch >= 5;
}

/**
 * Generate a memory summary from conversation history
 * Creates a 1-2 sentence summary of earlier context
 */
export function generateMemorySummary(messages: ChatMessage[]): string {
  if (messages.length <= 10) return '';
  
  // Take messages before the last 10 to create memory summary
  const earlierMessages = messages.slice(0, -10);
  
  if (earlierMessages.length === 0) return '';
  
  // Extract key topics from earlier messages
  const topics = new Set<string>();
  const userMessages = earlierMessages.filter(msg => msg.role === 'user');
  
  for (const message of userMessages) {
    // Simple keyword extraction (could be enhanced with NLP)
    const words = message.content.toLowerCase().split(/\s+/);
    const keyWords = words.filter(word => 
      word.length > 4 && 
      !['about', 'what', 'when', 'where', 'which', 'their', 'there', 'these', 'those'].includes(word)
    );
    keyWords.slice(0, 3).forEach(word => topics.add(word));
  }
  
  const topicList = Array.from(topics).slice(0, 5).join(', ');
  
  return `Earlier conversation covered topics including: ${topicList}.`;
}

/**
 * Build system prompt for Claude based on conversation state
 */
export function buildSystemPrompt(
  isFirstMessage: boolean,
  articleSummary?: string,
  webSnippets?: WebSnippet[],
  memorySummary?: string
): string {
  let prompt = `You are a knowledgeable and helpful AI assistant specialized in analyzing articles and providing insightful responses. You have access to web search capabilities and can access current information from the internet.

Your role is to help users understand and discuss articles they're reading. Be thorough, accurate, and helpful in your responses.`;

  if (isFirstMessage) {
    prompt += `\n\nThis is the first message in the conversation. Please provide a comprehensive response and include a brief summary (2-3 sentences) of the key points that would be useful for follow-up questions.`;
  } else {
    if (memorySummary) {
      prompt += `\n\nPrevious conversation context: ${memorySummary}`;
    }
    
    if (articleSummary) {
      prompt += `\n\nArticle summary: ${articleSummary}`;
    }
  }

  if (webSnippets && webSnippets.length > 0) {
    prompt += `\n\nRelevant web search results:\n`;
    webSnippets.forEach((snippet, index) => {
      prompt += `${index + 1}. ${snippet.title}: ${snippet.content}\n`;
    });
  }

  return prompt;
}

/**
 * Check if conversation is approaching token limits
 * Returns true if approaching 90K token limit
 */
export function isApproachingTokenLimit(totalTokens: number): boolean {
  const TOKEN_LIMIT = 90000; // 90K token limit
  const WARNING_THRESHOLD = 0.8; // 80% of limit
  
  return totalTokens > (TOKEN_LIMIT * WARNING_THRESHOLD);
}

/**
 * Truncate conversation history to fit within token limits
 * Keeps most recent messages and essential context
 */
export function truncateConversationHistory(
  messages: ChatMessage[],
  maxTokens: number = 80000
): ChatMessage[] {
  let totalTokens = 0;
  const truncatedMessages: ChatMessage[] = [];
  
  // Start from the most recent messages and work backwards
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const messageTokens = estimateTokens(message.content);
    
    if (totalTokens + messageTokens <= maxTokens) {
      truncatedMessages.unshift(message);
      totalTokens += messageTokens;
    } else {
      break;
    }
  }
  
  return truncatedMessages;
}

/**
 * Extract web search results from Claude's response
 * Parses tool calls to extract web search snippets
 */
export function extractWebSnippets(claudeResponse: any): WebSnippet[] {
  const snippets: WebSnippet[] = [];
  
  if (!claudeResponse.content) return snippets;
  
  for (const item of claudeResponse.content) {
    if (item.type === 'tool_use' && item.name === 'web_search') {
      // Extract search results from tool use
      if (item.input && item.input.search_results) {
        for (const result of item.input.search_results.slice(0, 5)) {
          snippets.push({
            title: result.title || 'Search Result',
            content: result.snippet || result.content || '',
            url: result.url,
            relevance_score: result.relevance_score || 0.5
          });
        }
      }
    }
  }
  
  return snippets;
}

/**
 * Validate conversation state data
 */
export function validateConversationState(state: Partial<ConversationState>): boolean {
  if (state.total_tokens && state.total_tokens < 0) return false;
  if (state.conversation_length && state.conversation_length < 0) return false;
  if (state.web_snippets && !Array.isArray(state.web_snippets)) return false;
  
  return true;
} 