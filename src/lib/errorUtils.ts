/**
 * Error Handling Utilities
 * 
 * Provides consistent error handling across the application.
 * Sanitizes error messages to prevent exposing internal details to users.
 */

/** Generic error type for catching unknown errors */
type UnknownError = unknown;

/**
 * Extracts a safe error message from any error type.
 * Never exposes internal error details to users.
 */
export function getSafeErrorMessage(error: UnknownError): string {
  if (error instanceof Error) {
    // Check for common user-friendly error types
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Unable to connect. Please check your internet connection.';
    }
    if (error.message.includes('unauthorized') || error.message.includes('401')) {
      return 'You are not authorized to perform this action.';
    }
    if (error.message.includes('forbidden') || error.message.includes('403')) {
      return 'Access denied.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Handles errors consistently across the application.
 * Logs the full error internally but returns a safe message for users.
 * 
 * @param error - The error to handle
 * @param context - Optional context string for logging
 * @returns A sanitized error message safe to display to users
 */
export function handleError(error: UnknownError, context?: string): string {
  // Log full error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.error(`[${context ?? 'Error'}]`, error);
  }
  
  return getSafeErrorMessage(error);
}

/**
 * Type guard to check if an error has a message property
 */
export function isErrorWithMessage(error: UnknownError): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}
