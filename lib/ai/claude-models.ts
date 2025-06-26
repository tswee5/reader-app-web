/**
 * Claude AI model names utility
 * This file provides the current model names for Claude AI to ensure
 * correct usage across the application.
 */

// Claude model IDs as of April 2025
export const CLAUDE_MODELS = {
  // Latest Claude 4 models (most powerful)
  OPUS_4: 'claude-opus-4-20250514',
  SONNET_4: 'claude-sonnet-4-20250514',
  
  // Claude 3.7 models (latest 3.x series)
  SONNET_3_7: 'claude-3-7-sonnet-20250219',
  
  // Claude 3.5 models (stable and cost-effective)
  SONNET_3_5: 'claude-3-5-sonnet-20241022',
  HAIKU_3_5: 'claude-3-5-haiku-20241022',
  
  // Legacy models (for backward compatibility)
  OPUS_3: 'claude-3-opus-20240229',
  HAIKU_3: 'claude-3-haiku-20240307',
  SONNET_3_5_OLD: 'claude-3-5-sonnet-20240620'
};

// Default model to use for most purposes (using latest Sonnet 4)
export const DEFAULT_MODEL = CLAUDE_MODELS.SONNET_4;

/**
 * Helper to select a model based on task requirements
 */
export function selectModelForTask(task: 'summarize' | 'chat' | 'complex' | 'quick'): string {
  switch (task) {
    case 'complex':
      return CLAUDE_MODELS.OPUS_4;
    case 'quick':
      return CLAUDE_MODELS.HAIKU_3_5;
    case 'summarize':
    case 'chat':
    default:
      return CLAUDE_MODELS.SONNET_4;
  }
}

/**
 * Get the latest API version to use with Claude
 */
export function getClaudeApiVersion(): string {
  // As of April 2025, this is the current API version that works
  return '2023-06-01';
}

/**
 * Get a human-readable name for a model ID
 */
export function getModelDisplayName(modelId: string): string {
  switch (modelId) {
    case CLAUDE_MODELS.OPUS_4:
      return 'Claude Opus 4';
    case CLAUDE_MODELS.SONNET_4:
      return 'Claude Sonnet 4';
    case CLAUDE_MODELS.SONNET_3_7:
      return 'Claude 3.7 Sonnet';
    case CLAUDE_MODELS.SONNET_3_5:
      return 'Claude 3.5 Sonnet';
    case CLAUDE_MODELS.HAIKU_3_5:
      return 'Claude 3.5 Haiku';
    case CLAUDE_MODELS.OPUS_3:
      return 'Claude 3 Opus';
    case CLAUDE_MODELS.HAIKU_3:
      return 'Claude 3 Haiku';
    case CLAUDE_MODELS.SONNET_3_5_OLD:
      return 'Claude 3.5 Sonnet (Previous)';
    default:
      return modelId;
  }
} 