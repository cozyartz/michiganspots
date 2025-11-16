/**
 * Copyright (c) 2025 Cozyartz Media Group d/b/a State Spots
 * Licensed under AGPL-3.0-or-later OR Commercial
 * See LICENSE and LICENSE-COMMERCIAL.md for details
 */

/**
 * Email Validator for Michigan Spots
 *
 * Validates email addresses using eValidate API service
 */

interface ValidationResult {
  email: string;
  severity: 'valid' | 'warning' | 'invalid';
  isValid: boolean;
  score: number;
  checks: {
    syntax: { passed: boolean; message: string };
    domain: { passed: boolean; message: string };
    mxRecords: { passed: boolean; message: string };
    disposable: { passed: boolean; message: string };
    catchAll: { passed: boolean; message: string };
    roleBased: { passed: boolean; message: string };
  };
  recommendations: string[];
  processingTime: number;
}

/**
 * Validate an email address using eValidate API
 * This function is meant to be called from API routes (server-side)
 */
export async function validateEmail(
  email: string,
  apiKey: string
): Promise<ValidationResult> {
  try {
    const response = await fetch('https://evalidate.andrea-b56.workers.dev/validate', {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Validation failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Email validation error:', error);
    throw error;
  }
}

/**
 * Quick validation check - returns just true/false
 */
export async function isValidEmail(
  email: string,
  apiKey: string,
  minScore = 60
): Promise<boolean> {
  try {
    const result = await validateEmail(email, apiKey);
    return result.isValid && result.score >= minScore;
  } catch (error) {
    // Fallback to basic regex if service is unavailable
    console.error('Email validation service unavailable, using fallback:', error);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

/**
 * Check if email is from a disposable provider
 */
export async function isDisposableEmail(
  email: string,
  apiKey: string
): Promise<boolean> {
  try {
    const result = await validateEmail(email, apiKey);
    return !result.checks.disposable.passed;
  } catch {
    return false;
  }
}

/**
 * Check if email is role-based (info@, support@, etc.)
 */
export async function isRoleBasedEmail(
  email: string,
  apiKey: string
): Promise<boolean> {
  try {
    const result = await validateEmail(email, apiKey);
    return !result.checks.roleBased.passed;
  } catch {
    return false;
  }
}

/**
 * Get user-friendly validation error message
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.isValid) {
    return '';
  }

  // Return the first recommendation or a generic message
  return result.recommendations[0] || 'Please provide a valid email address';
}
