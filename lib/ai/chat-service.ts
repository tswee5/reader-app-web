/**
 * Enhanced AI Chat Service for stateful conversations
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { CLAUDE_MODELS, getClaudeApiVersion } from '@/lib/ai/claude-models';
import {
  ChatMessage,
  ConversationState,
  WebSnippet,
  estimateTokens,
  estimateConversationTokens,
  requiresWebSearch,
  shouldPerformWebSearch,
  generateMemorySummary,
  buildSystemPrompt,
  isApproachingTokenLimit,
  truncateConversationHistory,
  extractWebSnippets,
  validateConversationState
} from '@/lib/ai/chat-utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseService = createClient<Database>(supabaseUrl, supabaseServiceKey);

// Claude API configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;

export interface ChatRequest {
  conversationId?: string;
  message: string;
  articleId: string;
  articleContent: string;
  articleUrl?: string;
  userId: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  conversationState: ConversationState;
  webSnippets?: WebSnippet[];
  tokenUsage: number;
  isFirstMessage: boolean;
}

export class AIChatService {
  /**
   * Process a chat message with stateful conversation management
   */
  static async processMessage(request: ChatRequest): Promise<ChatResponse> {
    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(request);
    const isFirstMessage = conversation.conversation_length === 0;

    // Get conversation messages
    const messages = await this.getConversationMessages(conversation.id);
    
    // Add current user message
    const currentMessage: ChatMessage = {
      role: 'user',
      content: request.message,
      created_at: new Date().toISOString()
    };
    
    const allMessages = [...messages, currentMessage];

    // Handle first message: generate summary and web search
    if (isFirstMessage) {
      return await this.handleFirstMessage(request, conversation, allMessages);
    }

    // Handle follow-up messages
    return await this.handleFollowUpMessage(request, conversation, allMessages);
  }

  /**
   * Handle the first message in a conversation
   */
  private static async handleFirstMessage(
    request: ChatRequest,
    conversation: any,
    messages: ChatMessage[]
  ): Promise<ChatResponse> {
    console.log('Processing first message in conversation');

    // Generate article summary and web search
    const { summary, webSnippets } = await this.generateArticleSummaryAndWebSearch(
      request.articleContent,
      request.articleUrl
    );

    // Build system prompt for first message
    const systemPrompt = buildSystemPrompt(true, summary, webSnippets);

    // Call Claude API
    const claudeResponse = await this.callClaudeAPI(systemPrompt, messages);

    // Extract response and additional web snippets
    const response = this.extractTextFromClaudeResponse(claudeResponse);
    const additionalSnippets = extractWebSnippets(claudeResponse);
    const allSnippets = [...(webSnippets || []), ...additionalSnippets].slice(0, 5);

    // Calculate token usage
    const tokenUsage = estimateConversationTokens(messages, systemPrompt, summary, allSnippets);

    // Update conversation state
    const conversationState: ConversationState = {
      article_summary: summary,
      web_snippets: allSnippets,
      total_tokens: tokenUsage,
      conversation_length: messages.length,
      last_web_search_at: new Date().toISOString()
    };

    // Save conversation state and messages
    await this.saveConversationState(conversation.id, conversationState);
    await this.saveMessages(conversation.id, messages, response);

    return {
      response,
      conversationId: conversation.id,
      conversationState,
      webSnippets: allSnippets,
      tokenUsage,
      isFirstMessage: true
    };
  }

  /**
   * Handle follow-up messages in a conversation
   */
  private static async handleFollowUpMessage(
    request: ChatRequest,
    conversation: any,
    messages: ChatMessage[]
  ): Promise<ChatResponse> {
    console.log('Processing follow-up message in conversation');

    // Get current conversation state
    const currentState: ConversationState = {
      article_summary: conversation.article_summary,
      web_snippets: conversation.web_snippets,
      memory_summary: conversation.memory_summary,
      total_tokens: conversation.total_tokens || 0,
      conversation_length: conversation.conversation_length || 0,
      last_web_search_at: conversation.last_web_search_at
    };

    // Check if we need web search for this message
    const needsWebSearch = requiresWebSearch(request.message) && 
      shouldPerformWebSearch(currentState.last_web_search_at);

    let webSnippets = currentState.web_snippets;
    let additionalSnippets: WebSnippet[] = [];

    // Perform web search if needed
    if (needsWebSearch) {
      console.log('Performing web search for follow-up message');
      additionalSnippets = await this.performWebSearch(request.message);
      webSnippets = [...(currentState.web_snippets || []), ...additionalSnippets].slice(0, 5);
    }

    // Generate memory summary if conversation is long
    let memorySummary = currentState.memory_summary;
    if (messages.length > 10 && !memorySummary) {
      memorySummary = generateMemorySummary(messages);
    }

    // Check token limits and truncate if necessary
    const systemPrompt = buildSystemPrompt(false, currentState.article_summary, webSnippets, memorySummary);
    let estimatedTokens = estimateConversationTokens(messages, systemPrompt, currentState.article_summary, webSnippets, memorySummary);

    if (isApproachingTokenLimit(estimatedTokens)) {
      console.log('Approaching token limit, truncating conversation history');
      const truncatedMessages = truncateConversationHistory(messages);
      messages.splice(0, messages.length - truncatedMessages.length);
      estimatedTokens = estimateConversationTokens(messages, systemPrompt, currentState.article_summary, webSnippets, memorySummary);
    }

    // Call Claude API
    const claudeResponse = await this.callClaudeAPI(systemPrompt, messages);
    const response = this.extractTextFromClaudeResponse(claudeResponse);

    // Extract any additional web snippets from Claude's response
    const responseSnippets = extractWebSnippets(claudeResponse);
    const allSnippets = [...(webSnippets || []), ...responseSnippets].slice(0, 5);

    // Update conversation state
    const updatedState: ConversationState = {
      ...currentState,
      web_snippets: allSnippets,
      memory_summary: memorySummary,
      total_tokens: estimatedTokens,
      conversation_length: messages.length,
      last_web_search_at: needsWebSearch ? new Date().toISOString() : currentState.last_web_search_at
    };

    // Save conversation state and messages
    await this.saveConversationState(conversation.id, updatedState);
    await this.saveMessages(conversation.id, messages, response);

    return {
      response,
      conversationId: conversation.id,
      conversationState: updatedState,
      webSnippets: allSnippets,
      tokenUsage: estimatedTokens,
      isFirstMessage: false
    };
  }

  /**
   * Generate article summary and perform initial web search
   */
  private static async generateArticleSummaryAndWebSearch(
    articleContent: string,
    articleUrl?: string
  ): Promise<{ summary: string; webSnippets: WebSnippet[] }> {
    try {
      // If articleUrl is present, use web search tool with the URL
      if (articleUrl) {
        console.log('Using URL-based approach for article:', articleUrl);
        const urlPrompt = `You are a knowledgeable and helpful AI assistant. You have access to web search capabilities and can access current information from the internet.\n\nPlease provide a comprehensive yet concise summary of the content available at: ${articleUrl}\n\nUse the web search tool to access and analyze this content, then provide a summary. You can also draw upon your training data and web search to provide additional context or background information that would enhance the summary.\n\nYour summary should:\n1. Capture the essence of the content in a structured format\n2. Be clear and informative\n3. Be around 3-5 paragraphs\n4. Include any relevant context or background information that would be helpful`;

        // Call Claude API with web search tool enabled
        const urlSummaryResponse = await this.callClaudeAPI(
          '',
          [{ role: 'user', content: urlPrompt, created_at: new Date().toISOString() }],
          true
        );
        const urlSummary = this.extractTextFromClaudeResponse(urlSummaryResponse);
        
        // Check for web search failure phrases
        const lower = urlSummary.toLowerCase();
        if (
          lower.includes('cannot access') ||
          lower.includes('cannot browse') ||
          lower.includes('cannot visit') ||
          lower.includes('cannot retrieve') ||
          lower.includes('not found') ||
          lower.includes('error')
        ) {
          console.log('Web search failed, falling back to content-based approach');
          // Fallback to content-based approach
          const truncatedContent = articleContent.length > 50000
            ? articleContent.substring(0, 50000) + '...'
            : articleContent;
          const contentPrompt = `You are a knowledgeable and helpful AI assistant. You have access to web search capabilities and can access current information from the internet.\n\nPlease provide a comprehensive yet concise summary of the following content:\n"""\n${truncatedContent}\n"""\n\nYou can also use web search to find additional relevant information, background context, or related insights that would enhance the summary.\n\nYour summary should:\n1. Capture the essence of the content in a structured format\n2. Be clear and informative\n3. Be around 3-5 paragraphs\n4. Include any relevant context or background information that would be helpful`;
          const contentSummaryResponse = await this.callClaudeAPI(
            '',
            [{ role: 'user', content: contentPrompt, created_at: new Date().toISOString() }],
            true
          );
          const summary = this.extractTextFromClaudeResponse(contentSummaryResponse);
          // Perform web search for additional context using the content
          const webSnippets = await this.performWebSearch(truncatedContent);
          return { summary, webSnippets };
        } else {
          console.log('Web search succeeded, extracting snippets');
          // Web search succeeded, extract web snippets from the response
          try {
            const webSnippets = extractWebSnippets(urlSummaryResponse);
            return { summary: urlSummary, webSnippets };
          } catch (snippetError) {
            console.error('Error extracting web snippets:', snippetError);
            // If snippet extraction fails, continue without snippets
            return { summary: urlSummary, webSnippets: [] };
          }
        }
      }
      
      // No URL: use content-based approach
      console.log('Using content-based approach (no URL available)');
      const truncatedContent = articleContent.length > 50000
        ? articleContent.substring(0, 50000) + '...'
        : articleContent;
      const summaryPrompt = `You are a knowledgeable and helpful AI assistant. You have access to web search capabilities and can access current information from the internet.\n\nPlease provide a comprehensive yet concise summary of the following content:\n"""\n${truncatedContent}\n"""\n\nYou can also use web search to find additional relevant information, background context, or related insights that would enhance the summary.\n\nYour summary should:\n1. Capture the essence of the content in a structured format\n2. Be clear and informative\n3. Be around 3-5 paragraphs\n4. Include any relevant context or background information that would be helpful`;
      const summaryResponse = await this.callClaudeAPI(
        '',
        [{ role: 'user', content: summaryPrompt, created_at: new Date().toISOString() }],
        true
      );
      const summary = this.extractTextFromClaudeResponse(summaryResponse);
      // Perform web search for additional context using the content
      const webSnippets = await this.performWebSearch(truncatedContent);
      return { summary, webSnippets };
    } catch (error) {
      console.error('Error in generateArticleSummaryAndWebSearch:', error);
      // Fallback to a simple summary if everything fails
      const fallbackSummary = `I encountered an error while analyzing this article. Here's a basic summary based on the content: ${articleContent.substring(0, 1000)}...`;
      return { summary: fallbackSummary, webSnippets: [] };
    }
  }

  /**
   * Perform web search using Claude's web search tool
   */
  private static async performWebSearch(query: string): Promise<WebSnippet[]> {
    try {
      const searchPrompt = `Please search for recent and relevant information about: ${query}\n\nFocus on finding current, accurate information that would be helpful for understanding this topic.`;

      // Defensive: always send a valid user message
      const searchResponse = await this.callClaudeAPI(
        '',
        [{ role: 'user', content: searchPrompt, created_at: new Date().toISOString() }],
        true
      );
      
      try {
        return extractWebSnippets(searchResponse);
      } catch (snippetError) {
        console.error('Error extracting web snippets from search response:', snippetError);
        return [];
      }
    } catch (error) {
      console.error('Error performing web search:', error);
      return [];
    }
  }

  /**
   * Call Claude API with proper error handling
   */
  private static async callClaudeAPI(
    systemPrompt: string,
    messages: ChatMessage[],
    enableWebSearch: boolean = false
  ): Promise<any> {
    // Defensive check: messages must be a non-empty array
    if (!messages || messages.length === 0) {
      console.error('[Claude API] Attempted to call Claude with empty messages array.', { systemPrompt, enableWebSearch });
      throw new Error('Claude API: messages array must contain at least one message.');
    }
    // Defensive check: first message should be a user message
    if (messages[0].role !== 'user' || !messages[0].content || messages[0].content.trim() === '') {
      console.error('[Claude API] First message is not a valid user message:', messages[0]);
      throw new Error('Claude API: first message must be a non-empty user message.');
    }

    const requestBody: any = {
      model: CLAUDE_MODELS.SONNET_4,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      max_tokens: 2000,
      temperature: 0.5
    };

    if (enableWebSearch) {
      requestBody.tools = [{
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3
      }];
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'anthropic-version': getClaudeApiVersion()
    };

    if (CLAUDE_API_KEY) {
      headers['x-api-key'] = CLAUDE_API_KEY;
    }

    // Log outgoing payload for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[Claude API] Sending request:', JSON.stringify(requestBody, null, 2));
    }

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Claude API] Error response:', errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Extract text content from Claude's response
   */
  private static extractTextFromClaudeResponse(response: any): string {
    try {
      if (!response || !response.content || !Array.isArray(response.content)) {
        console.error('Invalid response format from Claude API:', response);
        throw new Error('Invalid response format from Claude API');
      }

      const textContent = response.content
        .filter((item: any) => item.type === 'text')
        .map((item: any) => item.text)
        .join('');
      
      if (!textContent.trim()) {
        console.warn('No text content found in Claude response');
        return 'I apologize, but I was unable to generate a response. Please try again.';
      }
      
      return textContent;
    } catch (error) {
      console.error('Error extracting text from Claude response:', error);
      return 'I apologize, but I encountered an error while processing the response. Please try again.';
    }
  }

  /**
   * Get or create conversation
   */
  private static async getOrCreateConversation(request: ChatRequest): Promise<any> {
    if (request.conversationId) {
      const { data: conversation, error } = await supabaseService
        .from('ai_conversations')
        .select('*')
        .eq('id', request.conversationId)
        .eq('user_id', request.userId)
        .single();

      if (error || !conversation) {
        throw new Error('Conversation not found or access denied');
      }

      return conversation;
    }

    // Create new conversation
    const { data: conversation, error } = await supabaseService
      .from('ai_conversations')
      .insert({
        user_id: request.userId,
        article_id: request.articleId,
        title: request.message.substring(0, 50) + (request.message.length > 50 ? "..." : ""),
        total_tokens: 0,
        conversation_length: 0
      })
      .select()
      .single();

    if (error || !conversation) {
      throw new Error('Failed to create conversation');
    }

    return conversation;
  }

  /**
   * Get conversation messages
   */
  private static async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data: messages, error } = await supabaseService
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return (messages || []).map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      created_at: msg.created_at
    }));
  }

  /**
   * Save conversation state
   */
  private static async saveConversationState(conversationId: string, state: ConversationState): Promise<void> {
    if (!validateConversationState(state)) {
      throw new Error('Invalid conversation state');
    }

    const { error } = await supabaseService
      .from('ai_conversations')
      .update({
        article_summary: state.article_summary,
        web_snippets: state.web_snippets,
        memory_summary: state.memory_summary,
        total_tokens: state.total_tokens,
        last_web_search_at: state.last_web_search_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    if (error) {
      console.error('Error saving conversation state:', error);
      throw new Error('Failed to save conversation state');
    }
  }

  /**
   * Save messages to database
   */
  private static async saveMessages(
    conversationId: string,
    messages: ChatMessage[],
    aiResponse: string
  ): Promise<void> {
    const messagesToSave = [
      ...messages.map(msg => ({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
        created_at: msg.created_at || new Date().toISOString()
      })),
      {
        conversation_id: conversationId,
        role: 'assistant' as const,
        content: aiResponse,
        created_at: new Date().toISOString()
      }
    ];

    const { error } = await supabaseService
      .from('ai_messages')
      .insert(messagesToSave);

    if (error) {
      console.error('Error saving messages:', error);
      throw new Error('Failed to save messages');
    }
  }
} 