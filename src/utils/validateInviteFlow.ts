/**
 * Utility functions for validating invitation flow data and inputs
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates email format using a more robust regex
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || !email.trim()) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const trimmedEmail = email.trim();
  
  // More comprehensive email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    errors.push('Please enter a valid email address');
  }

  if (trimmedEmail.length > 254) {
    errors.push('Email address is too long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates individual name input
 */
export function validateIndividualName(name: string): ValidationResult {
  const errors: string[] = [];
  
  if (!name || !name.trim()) {
    errors.push('Individual name is required');
    return { isValid: false, errors };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length < 1) {
    errors.push('Name must be at least 1 character long');
  }

  if (trimmedName.length > 100) {
    errors.push('Name must be less than 100 characters');
  }

  // Check for potentially malicious content
  if (/<[^>]*>/.test(trimmedName)) {
    errors.push('Name cannot contain HTML tags');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates invitation message content
 */
export function validateMessage(message: string): ValidationResult {
  const errors: string[] = [];
  
  // Message is optional, but if provided, validate it
  if (message && message.trim()) {
    const trimmedMessage = message.trim();
    
    if (trimmedMessage.length > 1000) {
      errors.push('Message must be less than 1000 characters');
    }

    // Check for potentially malicious content
    if (/<script[^>]*>/.test(trimmedMessage.toLowerCase())) {
      errors.push('Message cannot contain script tags');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates all invitation form inputs together
 */
export function validateInvitationForm(data: {
  email: string;
  individualName: string;
  message?: string;
}): ValidationResult {
  const emailValidation = validateEmail(data.email);
  const nameValidation = validateIndividualName(data.individualName);
  const messageValidation = validateMessage(data.message || '');

  const allErrors = [
    ...emailValidation.errors,
    ...nameValidation.errors,
    ...messageValidation.errors
  ];

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Sanitizes user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}