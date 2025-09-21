import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    // Validate input
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Basic validation for TradingView username format
    const isValidFormat = validateUsernameFormat(username);
    if (!isValidFormat) {
      return NextResponse.json(
        {
          exists: false,
          error: 'Invalid username format',
          details:
            'Username must be 3-15 characters, alphanumeric with underscores/hyphens, cannot start/end with special characters',
        },
        { status: 400 }
      );
    }

    // Check if username exists on TradingView
    const exists = await checkTradingViewUsername(username);

    return NextResponse.json(
      {
        exists,
        username,
        message: exists
          ? 'Username found on TradingView'
          : 'Username not found on TradingView',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying TradingView username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function validateUsernameFormat(username: string): boolean {
  // TradingView username validation rules:
  // - 3-15 characters
  // - Alphanumeric, underscores, and hyphens only
  // - Cannot start or end with underscore or hyphen
  // - Cannot have consecutive underscores or hyphens
  if (!username) return false;

  const isValidLength = username.length >= 3 && username.length <= 15;
  const isValidCharacters = /^[a-zA-Z0-9_-]+$/.test(username);
  const startsEndsCorrectly = /^[a-zA-Z0-9].*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/.test(
    username
  );
  const noConsecutiveSpecial = !/[_-]{2,}/.test(username);

  return (
    isValidLength &&
    isValidCharacters &&
    startsEndsCorrectly &&
    noConsecutiveSpecial
  );
}

async function checkTradingViewUsername(username: string): Promise<boolean> {
  try {
    // Method 1: Check TradingView public profile
    const profileUrl = `https://www.tradingview.com/u/${username}/`;

    const response = await fetch(profileUrl, {
      method: 'HEAD', // Use HEAD to avoid downloading full page content
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    // If we get a 200 status, the profile exists
    // If we get a 404, the profile doesn't exist
    if (response.status === 200) {
      return true;
    } else if (response.status === 404) {
      return false;
    }

    // For other status codes, we'll assume the username doesn't exist
    // This is a conservative approach to avoid false positives
    return false;
  } catch (error) {
    // If there's a network error or timeout, we'll log it but not fail
    // This ensures the form can still be submitted even if verification fails
    console.warn(`Failed to verify TradingView username ${username}:`, error);

    // Return true to allow registration to proceed if verification fails
    // This prevents network issues from blocking legitimate users
    return true;
  }
}

// Alternative method for username verification (if the above doesn't work reliably)
async function checkTradingViewUsernameAlternative(
  username: string
): Promise<boolean> {
  try {
    // Method 2: Check TradingView API endpoints (if available)
    // Note: TradingView doesn't have a public API for username verification
    // This is a placeholder for alternative verification methods

    // Method 3: Check ideas/scripts by user (more reliable but slower)
    const ideasUrl = `https://www.tradingview.com/u/${username}/ideas/`;

    const response = await fetch(ideasUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    return response.status === 200;
  } catch (error) {
    console.warn(`Alternative verification failed for ${username}:`, error);
    return true; // Allow registration to proceed
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json(
      { error: 'Username parameter is required' },
      { status: 400 }
    );
  }

  try {
    const isValidFormat = validateUsernameFormat(username);
    if (!isValidFormat) {
      return NextResponse.json(
        {
          exists: false,
          error: 'Invalid username format',
          details:
            'Username must be 3-15 characters, alphanumeric with underscores/hyphens, cannot start/end with special characters',
        },
        { status: 400 }
      );
    }

    const exists = await checkTradingViewUsername(username);

    return NextResponse.json(
      {
        exists,
        username,
        message: exists
          ? 'Username found on TradingView'
          : 'Username not found on TradingView',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying TradingView username:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
