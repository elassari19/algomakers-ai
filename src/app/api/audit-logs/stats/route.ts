import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/audit-logs/stats - Get audit log statistics
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // Get start of today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    
    // Get start of this week (Sunday)
    const startOfWeek = new Date(now);
    const dayOfWeek = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all counts in parallel for better performance
    const [totalAudits, auditsThisMonth, auditsThisWeek, auditsToday] = await Promise.all([
      // Total audit logs
      prisma.auditLog.count(),
      
      // This month
      prisma.auditLog.count({
        where: {
          timestamp: {
            gte: startOfMonth,
          },
        },
      }),
      
      // This week
      prisma.auditLog.count({
        where: {
          timestamp: {
            gte: startOfWeek,
          },
        },
      }),
      
      // Today
      prisma.auditLog.count({
        where: {
          timestamp: {
            gte: startOfToday,
          },
        },
      }),
    ]);

    const stats = {
      totalAudits,
      auditsThisMonth,
      auditsThisWeek,
      auditsToday,
    };

    return NextResponse.json({
      success: true,
      stats,
      message: 'Audit stats fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch audit stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}