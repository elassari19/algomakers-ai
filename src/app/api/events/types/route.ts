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

    // Get all unique event types for this user
    const uniqueEventTypes = await prisma.event.findMany({
      where: { userId: session.user.id },
      select: { eventType: true },
      distinct: ['eventType'],
    });

    // Also get a sample of events to see the structure
    const sampleEvents = await prisma.event.findMany({
      where: { userId: session.user.id },
      select: { eventType: true, metadata: true },
      take: 10,
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json({
      success: true,
      uniqueEventTypes: uniqueEventTypes.map(e => e.eventType),
      sampleEvents,
      totalEvents: await prisma.event.count({ where: { userId: session.user.id } }),
    });
  } catch (error) {
    console.error('Error fetching event types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event types' },
      { status: 500 }
    );
  }
}