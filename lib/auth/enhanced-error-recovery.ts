'use client';

import { supabase } from '@/lib/supabase/client';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface NetworkStatus {
  isOnline: boolean;
  lastChecked: Date;
}

class EnhancedErrorRecovery {
  private networkStatus: NetworkStatus;
  private defaultRetryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };
  private isInitialized: boolean = false;

  constructor() {
    // Initialize with safe defaults for SSR
    this.networkStatus = {
      isOnline: true, // Assume online on server side
      lastChecked: new Date(),
    };
  }

  private initialize() {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    // Only initialize on the client side
    this.networkStatus.isOnline = navigator.onLine;
    this.setupNetworkListeners();
    this.isInitialized = true;
  }

  private setupNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.networkStatus.isOnline = true;
        this.networkStatus.lastChecked = new Date();
        console.log('Network connection restored');
      });

      window.addEventListener('offline', () => {
        this.networkStatus.isOnline = false;
        this.networkStatus.lastChecked = new Date();
        console.log('Network connection lost');
      });
    }
  }

  /**
   * Check if the device is currently online
   */
  isOnline(): boolean {
    // Initialize if not already done
    this.initialize();
    
    // Safe check for server-side rendering
    if (typeof window === 'undefined') {
      return true; // Assume online on server side
    }
    return this.networkStatus.isOnline && navigator.onLine;
  }

  /**
   * Get the last time network status was checked
   */
  getLastNetworkCheck(): Date {
    return this.networkStatus.lastChecked;
  }

  /**
   * Retry a function with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    const finalConfig = { ...this.defaultRetryConfig, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        // Check network connectivity before attempting
        if (!this.isOnline()) {
          throw new Error('No network connection available');
        }

        const result = await operation();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain types of errors
        if (this.shouldNotRetry(lastError)) {
          throw lastError;
        }

        // If this is the last attempt, throw the error
        if (attempt === finalConfig.maxAttempts) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, attempt - 1),
          finalConfig.maxDelay
        );

        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Operation failed after all retry attempts');
  }

  /**
   * Determine if an error should not be retried
   */
  private shouldNotRetry(error: Error): boolean {
    const nonRetryableErrors = [
      'Invalid credentials',
      'User not found',
      'Email not confirmed',
      'Invalid email or password',
      'User already registered',
      'Weak password',
    ];

    return nonRetryableErrors.some(message => 
      error.message.toLowerCase().includes(message.toLowerCase())
    );
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Enhanced authentication with automatic retry and recovery
   */
  async authenticateWithRecovery(
    authOperation: () => Promise<any>,
    config: Partial<RetryConfig> = {}
  ) {
    return this.retryWithBackoff(async () => {
      try {
        const result = await authOperation();
        
        // Check if authentication was successful
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        return result;
      } catch (error) {
        // If it's an auth error, try to refresh the session first
        if (this.isAuthError(error)) {
          console.log('Auth error detected, attempting session refresh...');
          
          try {
            const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              throw new Error(`Session refresh failed: ${refreshError.message}`);
            }
            
            if (refreshResult.session) {
              console.log('Session refreshed successfully, retrying operation...');
              // Retry the original operation with fresh session
              return await authOperation();
            }
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
            throw error; // Throw the original error if refresh fails
          }
        }
        
        throw error;
      }
    }, config);
  }

  /**
   * Check if an error is authentication-related
   */
  private isAuthError(error: any): boolean {
    if (!error) return false;
    
    const authErrorPatterns = [
      'invalid token',
      'token expired',
      'unauthorized',
      'authentication failed',
      'session expired',
      '401',
      '403',
    ];

    const errorMessage = error.message?.toLowerCase() || '';
    return authErrorPatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Enhanced API call with automatic retry and authentication recovery
   */
  async apiCallWithRecovery<T>(
    apiCall: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<T> {
    return this.retryWithBackoff(async () => {
      try {
        return await apiCall();
      } catch (error) {
        // If it's a 401/403 error, try to refresh auth and retry
        if (this.isAuthError(error)) {
          console.log('API auth error detected, attempting session refresh...');
          
          try {
            const { data: refreshResult, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              throw new Error(`Session refresh failed: ${refreshError.message}`);
            }
            
            if (refreshResult.session) {
              console.log('Session refreshed successfully, retrying API call...');
              return await apiCall();
            }
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
            throw error; // Throw the original error if refresh fails
          }
        }
        
        throw error;
      }
    }, config);
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error: any): string {
    if (!error) return 'An unknown error occurred';

    const errorMessage = error.message?.toLowerCase() || '';
    
    // Network errors
    if (!this.isOnline()) {
      return 'No internet connection. Please check your network and try again.';
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Authentication errors
    if (errorMessage.includes('invalid credentials') || errorMessage.includes('invalid email or password')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    if (errorMessage.includes('email not confirmed')) {
      return 'Please verify your email address before signing in.';
    }
    
    if (errorMessage.includes('user not found')) {
      return 'No account found with this email address.';
    }

    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Server errors
    if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
      return 'Server error. Please try again later.';
    }

    // Default error message
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if an operation should be retried based on error type
   */
  shouldRetryOperation(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Don't retry on user errors
    const nonRetryableErrors = [
      'invalid credentials',
      'user not found',
      'email not confirmed',
      'invalid email or password',
      'user already registered',
      'weak password',
      'validation error',
    ];

    if (nonRetryableErrors.some(pattern => errorMessage.includes(pattern))) {
      return false;
    }

    // Retry on network and server errors
    const retryableErrors = [
      'network',
      'fetch',
      'timeout',
      '500',
      '502',
      '503',
      '504',
      'internal server error',
      'service unavailable',
    ];

    return retryableErrors.some(pattern => errorMessage.includes(pattern));
  }
}

// Export singleton instance
export const enhancedErrorRecovery = new EnhancedErrorRecovery();

// Export types for use in components
export type { RetryConfig, NetworkStatus }; 