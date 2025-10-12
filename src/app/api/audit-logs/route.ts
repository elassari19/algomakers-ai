import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { patchMetricsStats } from '@/lib/stats-service';
import { StatsType } from '@/generated/prisma';

// GET /api/audit-logs - Fetch audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');
    const role = searchParams.get('role');
    const action = searchParams.get('action');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Search filter (by actor name, email, or action)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        {
          // If you want to search by actor name/email, you must join User table manually after fetching
          // Here, only search by action for now
          action: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Role filter (filter by actorRole field)
    if (role) {
      if (role === 'USER') {
        where.actorRole = 'USER';
      } else if (role === 'NOTUSER') {
        where.actorRole = { not: 'USER' };
      } // else ALL: do not filter by actorRole
    }

    // Action filter
    if (action && action !== 'all') {
      where.action = action.toUpperCase();
    }

    // Fetch audit logs with user relation for actor details
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip,
      include: {
        user: true,
      },
    });

  // Get total count for pagination
  const totalCount = await prisma.auditLog.count({ where });
  const hasMore = skip + limit < totalCount;

    return NextResponse.json({
      success: true,
      auditLogs,
      totalCount,
      hasMore,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      message: 'Audit logs fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch audit logs',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}