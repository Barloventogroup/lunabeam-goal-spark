/**
 * Error handling utilities for the application
 */

export interface AppError {
  message: string;
  code?: string;
  context?: string;
}

/**
 * Standardizes error messages for display to users
 */
export function formatErrorMessage(error: any, context?: string): AppError {
  // Default error message
  let message = 'An unexpected error occurred. Please try again.';
  let code = 'UNKNOWN_ERROR';

  if (error?.message) {
    // Supabase errors
    if (error.message.includes('Invalid login credentials')) {
      message = 'Invalid email or password. Please check your credentials and try again.';
      code = 'INVALID_CREDENTIALS';
    } else if (error.message.includes('User already registered')) {
      message = 'An account with this email already exists. Please sign in instead.';
      code = 'USER_EXISTS';
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Please check your email and click the confirmation link before signing in.';
      code = 'EMAIL_NOT_CONFIRMED';
    } else if (error.message.includes('Invalid email')) {
      message = 'Please enter a valid email address.';
      code = 'INVALID_EMAIL';
    } else if (error.message.includes('Password should be at least')) {
      message = 'Password must be at least 6 characters long.';
      code = 'WEAK_PASSWORD';
    } else if (error.message.includes('Rate limit exceeded')) {
      message = 'Too many attempts. Please wait a moment before trying again.';
      code = 'RATE_LIMIT';
    } else if (error.message.includes('Network')) {
      message = 'Network error. Please check your connection and try again.';
      code = 'NETWORK_ERROR';
    } else {
      // Use the original error message but make it user-friendly
      message = error.message;
    }
  }

  return {
    message,
    code,
    context
  };
}

/**
 * Logs errors for debugging while returning user-friendly messages
 */
export function handleError(error: any, context?: string): AppError {
  // Log the full error for debugging
  console.error(`Error in ${context || 'unknown context'}:`, error);

  // Return formatted error for user display
  return formatErrorMessage(error, context);
}

/**
 * Specific error handlers for common scenarios
 */
export const ErrorHandlers = {
  auth: (error: any) => handleError(error, 'authentication'),
  invitation: (error: any) => handleError(error, 'invitation'),
  profile: (error: any) => handleError(error, 'profile'),
  network: (error: any) => handleError(error, 'network'),
};