import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/auth/session-debug - Debug endpoint to check current session
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      success: true,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: session.user?.role,
        },
        expires: session.expires,
      } : null,
      message: session ? 'Session found' : 'No session found',
    });
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        session: null,
      },
      { status: 500 }
    );
  }
}