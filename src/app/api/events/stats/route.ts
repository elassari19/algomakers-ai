import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday.getTime() - (startOfToday.getDay() * 24 * 60 * 60 * 1000));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get stats
    const [totalEvents, eventsThisMonth, eventsThisWeek, eventsToday] = await Promise.all([
      prisma.event.count({
        where: { userId },
      }),
      prisma.event.count({
        where: {
          userId,
          timestamp: { gte: startOfMonth },
        },
      }),
      prisma.event.count({
        where: {
          userId,
          timestamp: { gte: startOfWeek },
        },
      }),
      prisma.event.count({
        where: {
          userId,
          timestamp: { gte: startOfToday },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalEvents,
        eventsThisMonth,
        eventsThisWeek,
        eventsToday,
      },
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event stats' },
      { status: 500 }
    );
  }
}