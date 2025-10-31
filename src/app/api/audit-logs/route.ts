import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/audit-logs - Fetch audit logs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('q');
    const role = searchParams.get('role');
    const action = searchParams.get('action');
    const responseStatus = searchParams.get('responseStatus');
    const period = searchParams.get('period');

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // Search filter (by actor name, email, or action)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        {
          responseStatus: {
            contains: searchTerm,
            mode: 'insensitive',
          },
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

    if(responseStatus) {
      where.responseStatus = responseStatus.toUpperCase();
    }

  if (period && period !== 'all') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
        break;
      case '3d':
        startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        startDate = new Date(now.getTime() - 182 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0);
    }

    where.timestamp = {
      gte: startDate,
    };
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

    const availableEventTypes = await prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
    });

    // Get total count for pagination
    const total = await prisma.auditLog.count({ where });
    const thisMonth = await prisma.auditLog.count({ where: { timestamp: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), }, }, });
    const thisWeek = await prisma.auditLog.count({ where: { timestamp: { gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000), }, }, });
    const today = await prisma.auditLog.count({ where: { timestamp: { gte: new Date(new Date().setHours(0, 0, 0, 0)), }, }, });
    const hasMore = skip + limit < total;

    return NextResponse.json({
      success: true,
      auditLogs,
      state: {
        total,
        thisMonth,
        thisWeek,
        today,
      },
      hasMore,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      availableEventTypes: availableEventTypes.map(et => et.action),
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