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

    // Search filter (by admin name, email, or action)
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        {
          admin: {
            name: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          admin: {
            email: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        },
        {
          action: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Role filter
    if (role && role !== 'all') {
      where.admin = {
        ...where.admin,
        role: role.toUpperCase(),
      };
    }

    // Action filter
    if (action && action !== 'all') {
      where.action = action.toUpperCase();
    }

    // Fetch audit logs with admin details
    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      skip,
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

// POST /api/audit-logs - Create a new audit log entry (for system use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, action, targetId, targetType, details } = body;

    if (!adminId || !action) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin ID and action are required',
        },
        { status: 400 }
      );
    }

    // Verify admin exists
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Admin user not found',
        },
        { status: 404 }
      );
    }

    // Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        adminId,
        action: action.toUpperCase(),
        targetId: targetId || null,
        targetType: targetType || null,
        details: details || null,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Track audit log creation stats
    try {
      await patchMetricsStats(StatsType.AUDIT_METRICS, {
        id: auditLog.id,
        adminId: auditLog.adminId,
        adminName: auditLog.admin.name || 'Unknown',
        adminEmail: auditLog.admin.email,
        adminRole: auditLog.admin.role,
        action: auditLog.action,
        targetId: auditLog.targetId,
        targetType: auditLog.targetType,
        createdAt: new Date().toISOString(),
        hasDetails: !!auditLog.details,
        type: 'AUDIT_LOG_CREATION'
      });
    } catch (statsError) {
      console.error('Failed to track audit log creation stats:', statsError);
    }

    return NextResponse.json({
      success: true,
      auditLog,
      message: 'Audit log created successfully',
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create audit log',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}