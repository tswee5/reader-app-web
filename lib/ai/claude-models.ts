/**
 * Claude AI model names utility
 * This file provides the current model names for Claude AI to ensure
 * correct usage across the application.
 */

// Claude model IDs as of October 2024
export const CLAUDE_MODELS = {
  // Most powerful model - best for complex reasoning
  OPUS: 'claude-3-opus-20240229',
  
  // Balanced model - good general purpose usage
  SONNET: 'claude-3-5-sonnet-20241022',  // Latest version (Oct 2024)
  SONNET_OLD: 'claude-3-5-sonnet-20240620', // Previous version
  
  // Fastest and most economical model
  HAIKU: 'claude-3-5-haiku-20241022',
  HAIKU_OLD: 'claude-3-haiku-20240307',
  
  // Experimental model with higher capabilities
  SONNET_NEXT: 'claude-3-7-sonnet-20250219'
};

// Default model to use for most purposes
export const DEFAULT_MODEL = CLAUDE_MODELS.SONNET;

/**
 * Helper to select a model based on task requirements
 */
export function selectModelForTask(task: 'summarize' | 'chat' | 'complex' | 'quick'): string {
  switch (task) {
    case 'complex':
      return CLAUDE_MODELS.OPUS;
    case 'quick':
      return CLAUDE_MODELS.HAIKU;
    case 'summarize':
    case 'chat':
    default:
      return CLAUDE_MODELS.SONNET;
  }
}

/**
 * Get the latest API version to use with Claude
 */
export function getClaudeApiVersion(): string {
  // As of Oct 2024, this is the recommended API version
  return '2023-06-01';
}

/**
 * Get a human-readable name for a model ID
 */
export function getModelDisplayName(modelId: string): string {
  switch (modelId) {
    case CLAUDE_MODELS.OPUS:
      return 'Claude 3 Opus';
    case CLAUDE_MODELS.SONNET:
      return 'Claude 3.5 Sonnet';
    case CLAUDE_MODELS.SONNET_OLD:
      return 'Claude 3.5 Sonnet (Previous)';
    case CLAUDE_MODELS.HAIKU:
      return 'Claude 3.5 Haiku';
    case CLAUDE_MODELS.HAIKU_OLD:
      return 'Claude 3 Haiku';
    case CLAUDE_MODELS.SONNET_NEXT:
      return 'Claude 3.7 Sonnet (Experimental)';
    default:
      return modelId;
  }
} 