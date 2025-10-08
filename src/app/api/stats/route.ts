import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatsPeriod, StatsType } from '@/generated/prisma';

// GET /api/stats?pairId=... (optional)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get('pairId');
    const type = searchParams.get('type');

    let whereClause: any = {};

    // Filter by type if provided, otherwise default to FILE_METRICS
    if (type) {
      whereClause.type = type as StatsType;
    } else {
      whereClause.type = StatsType.FILE_METRICS;
    }

    // If pairId is provided, filter by it
    if (pairId) {
      whereClause.metadata = {
        path: ['pairId'],
        equals: pairId
      };
    }

    // Find stats records for file metrics
    const stats = await prisma.stats.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/stats
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Only require pairId, accept any other data structure
    if (!body.pairId) {
      return NextResponse.json({ error: 'Missing pairId' }, { status: 400 });
    }

    const pairId = body.pairId;

    // Parse any string fields that might be JSON
    const processedData = { ...body };

    // Find existing stats record for the pair by filtering type and pairId
    const existingStats = await prisma.stats.findFirst({
      where: {
        type: StatsType.FILE_METRICS,
        metadata: {
          path: ['pairId'],
          equals: pairId
        }
      },
      select: { id: true, metadata: true }
    });

    let stats;
    if (existingStats) {
      // Update existing record
      stats = await prisma.stats.update({
        where: { id: existingStats.id },
        data: {
          updatedAt: new Date(),
          metadata: {
            ...(existingStats.metadata as Record<string, any> || {}),
            ...processedData
          }
        }
      });
      console.log('Stats updated for pairId:', pairId);
    } else {
      // Create new record
      stats = await prisma.stats.create({
        data: {
          type: StatsType.FILE_METRICS,
          period: StatsPeriod.ALL_TIME,
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            ...processedData
          }
        }
      });
      console.log('Stats created for pairId:', pairId);
    }

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error upserting stats:', error);
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/stats?pairId=...
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pairId = searchParams.get('pairId');

    if (!pairId) {
      return NextResponse.json(
        { error: 'Missing pairId' },
        { status: 400 }
      );
    }

    // Find existing stats record by filtering type and pairId
    const existingStats = await prisma.stats.findFirst({
      where: {
        type: StatsType.FILE_METRICS,
        metadata: {
          path: ['pairId'],
          equals: pairId
        }
      }
    });

    if (!existingStats) {
      console.log('No stats record found for pairId:', pairId);
      return NextResponse.json({ success: true, message: 'No stats record found' });
    }

    await prisma.stats.delete({
      where: { id: existingStats.id }
    });

    console.log('Stats deleted for pairId:', pairId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stats:', error);
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
