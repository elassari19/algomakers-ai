/**
 * Authentication Error Messages
 * Static error messages to prevent exposing backend implementation details to users
 */

export const AUTH_ERRORS = {
  // Sign In Errors
  INVALID_CREDENTIALS:
    'Invalid email or password. Please check your credentials and try again.',
  ACCOUNT_NOT_FOUND:
    'No account found with this email address. Please sign up first.',
  ACCOUNT_LOCKED:
    'Your account has been temporarily locked. Please try again later.',
  TOO_MANY_ATTEMPTS:
    'Too many failed login attempts. Please wait a few minutes before trying again.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before signing in.',
  ACCOUNT_SUSPENDED:
    'Your account has been suspended. Please contact support for assistance.',
  ACCOUNT_INACTIVE:
    'Your account is inactive. Please contact support to reactivate your account.',
  ACCOUNT_DELETED:
    'Your account has been deleted and cannot be accessed.',
  ACCOUNT_UNVERIFIED:
    'Your account is unverified. Please verify your email address before signing in.',

  // Sign Up Errors
  EMAIL_ALREADY_EXISTS:
    'An account with this email already exists. Please use a different email or sign in.',
  WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
  INVALID_EMAIL_FORMAT: 'Please enter a valid email address.',
  REGISTRATION_FAILED: 'Failed to create account. Please try again.',
  TERMS_NOT_ACCEPTED: 'Please accept the terms and conditions to continue.',

  // Password Reset Errors
  RESET_TOKEN_INVALID:
    'Password reset link is invalid or has expired. Please request a new one.',
  RESET_TOKEN_EXPIRED:
    'Password reset link has expired. Please request a new one.',
  EMAIL_NOT_FOUND: 'No account found with this email address.',
  RESET_FAILED: 'Failed to reset password. Please try again.',
  PASSWORD_RESET_COOLDOWN:
    'Please wait before requesting another password reset.',

  // General Auth Errors
  NETWORK_ERROR:
    'Connection error. Please check your internet connection and try again.',
  SERVER_ERROR:
    'Something went wrong on our end. Please try again in a few moments.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN:
    'Access denied. You do not have permission to perform this action.',

  // OAuth Errors
  OAUTH_ERROR: 'Failed to sign in with social provider. Please try again.',
  OAUTH_CANCELLED:
    'Sign in was cancelled. Please try again if you wish to continue.',
  OAUTH_ACCOUNT_LINKING_ERROR:
    'Unable to link social account. This email may already be registered.',

  // Profile/Account Errors
  PROFILE_UPDATE_FAILED: 'Failed to update profile. Please try again.',
  TRADINGVIEW_USERNAME_INVALID: 'Invalid TradingView username format.',
  TRADINGVIEW_USERNAME_EXISTS:
    'This TradingView username is already linked to another account.',

  // Validation Errors
  REQUIRED_FIELD_MISSING: 'Please fill in all required fields.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  INVALID_INPUT: 'Please check your input and try again.',

  // Default fallback
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Maps backend error codes/messages to user-friendly messages
 */
export function mapBackendError(
  backendError: string | null | undefined
): string {
  if (!backendError) {
    return AUTH_ERRORS.UNKNOWN_ERROR;
  }

  const errorLower = backendError.toLowerCase();

  // Sign In related errors
  if (
    errorLower.includes('invalid credentials') ||
    errorLower.includes('wrong password') ||
    errorLower.includes('incorrect password')
  ) {
    return AUTH_ERRORS.INVALID_CREDENTIALS;
  }

  if (
    errorLower.includes('user not found') ||
    errorLower.includes('account not found')
  ) {
    return AUTH_ERRORS.ACCOUNT_NOT_FOUND;
  }

  if (
    errorLower.includes('account locked') ||
    errorLower.includes('temporarily locked')
  ) {
    return AUTH_ERRORS.ACCOUNT_LOCKED;
  }

  if (
    errorLower.includes('too many attempts') ||
    errorLower.includes('rate limit')
  ) {
    return AUTH_ERRORS.TOO_MANY_ATTEMPTS;
  }

  if (
    errorLower.includes('email not verified') ||
    errorLower.includes('verify email')
  ) {
    return AUTH_ERRORS.EMAIL_NOT_VERIFIED;
  }

  if (errorLower.includes('account suspended') || errorLower.includes('suspended')) {
    return AUTH_ERRORS.ACCOUNT_SUSPENDED;
  }

  if (errorLower.includes('account inactive') || errorLower.includes('inactive')) {
    return AUTH_ERRORS.ACCOUNT_INACTIVE;
  }

  if (errorLower.includes('account deleted') || errorLower.includes('deleted')) {
    return AUTH_ERRORS.ACCOUNT_DELETED;
  }

  if (errorLower.includes('account unverified') || errorLower.includes('unverified')) {
    return AUTH_ERRORS.ACCOUNT_UNVERIFIED;
  }

  if (
    errorLower.includes('account locked') ||
    errorLower.includes('locked') ||
    errorLower.includes('temporarily locked')
  ) {
    return AUTH_ERRORS.ACCOUNT_LOCKED;
  }

  // Sign Up related errors
  if (
    errorLower.includes('email already exists') ||
    errorLower.includes('user already exists') ||
    errorLower.includes('duplicate key') ||
    errorLower.includes('unique constraint')
  ) {
    return AUTH_ERRORS.EMAIL_ALREADY_EXISTS;
  }

  if (
    errorLower.includes('weak password') ||
    errorLower.includes('password strength')
  ) {
    return AUTH_ERRORS.WEAK_PASSWORD;
  }

  if (
    errorLower.includes('invalid email') ||
    errorLower.includes('email format')
  ) {
    return AUTH_ERRORS.INVALID_EMAIL_FORMAT;
  }

  if (
    errorLower.includes('registration failed') ||
    errorLower.includes('failed to create account') ||
    errorLower.includes('signup failed')
  ) {
    return AUTH_ERRORS.REGISTRATION_FAILED;
  }

  if (
    errorLower.includes('terms not accepted') ||
    errorLower.includes('accept terms') ||
    errorLower.includes('terms and conditions')
  ) {
    return AUTH_ERRORS.TERMS_NOT_ACCEPTED;
  }

  // Password Reset related errors
  if (
    errorLower.includes('invalid token') ||
    errorLower.includes('token not found')
  ) {
    return AUTH_ERRORS.RESET_TOKEN_INVALID;
  }

  if (
    errorLower.includes('token expired') ||
    errorLower.includes('expired token')
  ) {
    return AUTH_ERRORS.RESET_TOKEN_EXPIRED;
  }

  if (errorLower.includes('email not found') && errorLower.includes('reset')) {
    return AUTH_ERRORS.EMAIL_NOT_FOUND;
  }

  if (errorLower.includes('cooldown') || errorLower.includes('wait before')) {
    return AUTH_ERRORS.PASSWORD_RESET_COOLDOWN;
  }

  if (
    errorLower.includes('reset failed') ||
    errorLower.includes('failed to reset password') ||
    errorLower.includes('password reset error')
  ) {
    return AUTH_ERRORS.RESET_FAILED;
  }

  // OAuth related errors
  if (errorLower.includes('oauth') || errorLower.includes('social login')) {
    return AUTH_ERRORS.OAUTH_ERROR;
  }

  if (errorLower.includes('cancelled') || errorLower.includes('canceled')) {
    return AUTH_ERRORS.OAUTH_CANCELLED;
  }

  if (
    errorLower.includes('oauth account linking') ||
    errorLower.includes('unable to link') ||
    errorLower.includes('account linking error') ||
    errorLower.includes('social account linking')
  ) {
    return AUTH_ERRORS.OAUTH_ACCOUNT_LINKING_ERROR;
  }

  // Network/Server errors
  if (
    errorLower.includes('network') ||
    errorLower.includes('connection') ||
    errorLower.includes('fetch')
  ) {
    return AUTH_ERRORS.NETWORK_ERROR;
  }

  if (
    errorLower.includes('server error') ||
    errorLower.includes('internal server') ||
    errorLower.includes('500')
  ) {
    return AUTH_ERRORS.SERVER_ERROR;
  }

  if (errorLower.includes('unauthorized') || errorLower.includes('401')) {
    return AUTH_ERRORS.UNAUTHORIZED;
  }

  if (errorLower.includes('forbidden') || errorLower.includes('403')) {
    return AUTH_ERRORS.FORBIDDEN;
  }

  if (
    errorLower.includes('session expired') ||
    errorLower.includes('session timeout') ||
    errorLower.includes('token expired')
  ) {
    return AUTH_ERRORS.SESSION_EXPIRED;
  }

  // Profile/Account related errors
  if (
    errorLower.includes('profile update failed') ||
    errorLower.includes('failed to update profile') ||
    errorLower.includes('profile error')
  ) {
    return AUTH_ERRORS.PROFILE_UPDATE_FAILED;
  }

  // TradingView related errors
  if (errorLower.includes('tradingview')) {
    if (errorLower.includes('invalid') || errorLower.includes('format')) {
      return AUTH_ERRORS.TRADINGVIEW_USERNAME_INVALID;
    }
    if (errorLower.includes('exists') || errorLower.includes('taken')) {
      return AUTH_ERRORS.TRADINGVIEW_USERNAME_EXISTS;
    }
  }

  // Validation errors
  if (
    errorLower.includes('validation') ||
    errorLower.includes('required field')
  ) {
    return AUTH_ERRORS.REQUIRED_FIELD_MISSING;
  }

  if (errorLower.includes('password') && errorLower.includes('match')) {
    return AUTH_ERRORS.PASSWORD_MISMATCH;
  }

  if (
    errorLower.includes('required field') ||
    errorLower.includes('field is required') ||
    errorLower.includes('missing required')
  ) {
    return AUTH_ERRORS.REQUIRED_FIELD_MISSING;
  }

  if (
    errorLower.includes('invalid input') ||
    errorLower.includes('invalid data') ||
    errorLower.includes('malformed input')
  ) {
    return AUTH_ERRORS.INVALID_INPUT;
  }

  // Default fallback
  return AUTH_ERRORS.UNKNOWN_ERROR;
}

/**
 * Error handler for auth operations
 */
export function handleAuthError(error: unknown): string {
  // Handle Error objects
  if (error instanceof Error) {
    return mapBackendError(error.message);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return mapBackendError(error);
  }

  // Handle HTTP Response errors
  if (error && typeof error === 'object' && 'message' in error) {
    return mapBackendError((error as any).message);
  }

  // Handle fetch/network errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    switch (status) {
      case 400:
        return AUTH_ERRORS.INVALID_INPUT;
      case 401:
        return AUTH_ERRORS.UNAUTHORIZED;
      case 403:
        return AUTH_ERRORS.FORBIDDEN;
      case 404:
        return AUTH_ERRORS.ACCOUNT_NOT_FOUND;
      case 429:
        return AUTH_ERRORS.TOO_MANY_ATTEMPTS;
      case 500:
        return AUTH_ERRORS.SERVER_ERROR;
      default:
        return AUTH_ERRORS.NETWORK_ERROR;
    }
  }

  // Handle NextAuth specific errors
  if (error && typeof error === 'object' && 'type' in error) {
    const errorType = (error as any).type;
    switch (errorType) {
      case 'CredentialsSignin':
        return AUTH_ERRORS.INVALID_CREDENTIALS;
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
        return AUTH_ERRORS.OAUTH_ERROR;
      case 'EmailSignin':
        return AUTH_ERRORS.EMAIL_NOT_VERIFIED;
      case 'Callback':
        return AUTH_ERRORS.OAUTH_CANCELLED;
      case 'OAuthAccountNotLinked':
        return AUTH_ERRORS.OAUTH_ACCOUNT_LINKING_ERROR;
      case 'SessionRequired':
        return AUTH_ERRORS.SESSION_EXPIRED;
      default:
        return AUTH_ERRORS.UNKNOWN_ERROR;
    }
  }

  // Handle Prisma/Database errors
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as any).code;
    switch (code) {
      case 'P2002': // Unique constraint violation
        return AUTH_ERRORS.EMAIL_ALREADY_EXISTS;
      case 'P2025': // Record not found
        return AUTH_ERRORS.ACCOUNT_NOT_FOUND;
      case 'P1001': // Connection error
      case 'P1002': // Connection timeout
        return AUTH_ERRORS.NETWORK_ERROR;
      default:
        return AUTH_ERRORS.SERVER_ERROR;
    }
  }

  // Handle validation errors (Zod, etc.)
  if (error && typeof error === 'object' && 'issues' in error) {
    return AUTH_ERRORS.INVALID_INPUT;
  }

  // Default fallback
  return AUTH_ERRORS.UNKNOWN_ERROR;
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    // Handle objects with message property
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }

    // Handle objects with error property
    if ('error' in error && typeof (error as any).error === 'string') {
      return (error as any).error;
    }

    // Handle validation errors with issues
    if ('issues' in error && Array.isArray((error as any).issues)) {
      const issues = (error as any).issues;
      return issues.map((issue: any) => issue.message || 'Validation error').join(', ');
    }

    // Handle response-like objects
    if ('statusText' in error && typeof (error as any).statusText === 'string') {
      return (error as any).statusText;
    }

    // Try to stringify the object
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error object';
    }
  }

  return 'Unknown error';
}

/**
 * Check if error indicates a specific condition
 */
export function isAuthErrorType(error: unknown, errorType: keyof typeof AUTH_ERRORS): boolean {
  const mappedError = handleAuthError(error);
  return mappedError === AUTH_ERRORS[errorType];
}

/**
 * Get error category from error message
 */
export function getErrorCategory(error: unknown): 'signin' | 'signup' | 'reset' | 'oauth' | 'profile' | 'validation' | 'network' | 'server' | 'unknown' {
  const mappedError: any = handleAuthError(error);
  
  // Sign In errors
  if ([
    AUTH_ERRORS.INVALID_CREDENTIALS,
    AUTH_ERRORS.ACCOUNT_NOT_FOUND,
    AUTH_ERRORS.ACCOUNT_LOCKED,
    AUTH_ERRORS.TOO_MANY_ATTEMPTS,
    AUTH_ERRORS.EMAIL_NOT_VERIFIED,
    AUTH_ERRORS.ACCOUNT_SUSPENDED,
    AUTH_ERRORS.ACCOUNT_INACTIVE,
    AUTH_ERRORS.ACCOUNT_DELETED,
    AUTH_ERRORS.ACCOUNT_UNVERIFIED,
  ].includes(mappedError)) {
    return 'signin';
  }
  
  // Sign Up errors
  if ([
    AUTH_ERRORS.EMAIL_ALREADY_EXISTS,
    AUTH_ERRORS.WEAK_PASSWORD,
    AUTH_ERRORS.INVALID_EMAIL_FORMAT,
    AUTH_ERRORS.REGISTRATION_FAILED,
    AUTH_ERRORS.TERMS_NOT_ACCEPTED,
  ].includes(mappedError)) {
    return 'signup';
  }
  
  // Password Reset errors
  if ([
    AUTH_ERRORS.RESET_TOKEN_INVALID,
    AUTH_ERRORS.RESET_TOKEN_EXPIRED,
    AUTH_ERRORS.EMAIL_NOT_FOUND,
    AUTH_ERRORS.RESET_FAILED,
    AUTH_ERRORS.PASSWORD_RESET_COOLDOWN,
  ].includes(mappedError)) {
    return 'reset';
  }
  
  // OAuth errors
  if ([
    AUTH_ERRORS.OAUTH_ERROR,
    AUTH_ERRORS.OAUTH_CANCELLED,
    AUTH_ERRORS.OAUTH_ACCOUNT_LINKING_ERROR,
  ].includes(mappedError)) {
    return 'oauth';
  }
  
  // Profile errors
  if ([
    AUTH_ERRORS.PROFILE_UPDATE_FAILED,
    AUTH_ERRORS.TRADINGVIEW_USERNAME_INVALID,
    AUTH_ERRORS.TRADINGVIEW_USERNAME_EXISTS,
  ].includes(mappedError)) {
    return 'profile';
  }
  
  // Validation errors
  if ([
    AUTH_ERRORS.REQUIRED_FIELD_MISSING,
    AUTH_ERRORS.PASSWORD_MISMATCH,
    AUTH_ERRORS.INVALID_INPUT,
  ].includes(mappedError)) {
    return 'validation';
  }
  
  // Network errors
  if (mappedError === AUTH_ERRORS.NETWORK_ERROR) {
    return 'network';
  }
  
  // Server errors
  if ([
    AUTH_ERRORS.SERVER_ERROR,
    AUTH_ERRORS.UNAUTHORIZED,
    AUTH_ERRORS.FORBIDDEN,
    AUTH_ERRORS.SESSION_EXPIRED,
  ].includes(mappedError)) {
    return 'server';
  }
  
  return 'unknown';
}
