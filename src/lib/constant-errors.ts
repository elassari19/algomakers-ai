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

  // OAuth related errors
  if (errorLower.includes('oauth') || errorLower.includes('social login')) {
    return AUTH_ERRORS.OAUTH_ERROR;
  }

  if (errorLower.includes('cancelled') || errorLower.includes('canceled')) {
    return AUTH_ERRORS.OAUTH_CANCELLED;
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

  // Default fallback
  return AUTH_ERRORS.UNKNOWN_ERROR;
}

/**
 * Error handler for auth operations
 */
export function handleAuthError(error: unknown): string {
  if (error instanceof Error) {
    return mapBackendError(error.message);
  }

  if (typeof error === 'string') {
    return mapBackendError(error);
  }

  return AUTH_ERRORS.UNKNOWN_ERROR;
}
