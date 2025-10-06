import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType, Role } from "@/generated/prisma";

// GET /api/notifications/stats - Get notification statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    
    // Check if user has admin privileges to view stats
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER && user.role !== Role.SUPPORT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build where clause based on user role
    let whereClause: any = {};

    if (user.role === Role.SUPPORT) {
      // Support can only see general and non-sensitive notifications
      whereClause = {
        OR: [
          { adminId: user.id },
          { 
            type: { 
              in: [NotificationType.GENERAL, NotificationType.RENEWAL_REMINDER] 
            } 
          }
        ]
      };
    } else {
      // Admin and Manager can see all notifications
      whereClause = {
        OR: [
          { adminId: user.id },
          { userId: null } // System-wide notifications
        ]
      };
    }

    // Get total count
    const total = await prisma.notification.count({
      where: whereClause
    });

    // Get unread count
    const unread = await prisma.notification.count({
      where: {
        ...whereClause,
        isRead: false
      }
    });

    // Get count by type
    const byTypeResults = await prisma.notification.groupBy({
      by: ['type'],
      where: whereClause,
      _count: {
        id: true
      }
    });

    // Transform byType results into a more usable format
    const byType: Record<NotificationType, number> = {} as Record<NotificationType, number>;
    
    // Initialize all types with 0
    Object.values(NotificationType).forEach(type => {
      byType[type] = 0;
    });
    
    // Fill in actual counts
    byTypeResults.forEach(result => {
      byType[result.type] = result._count.id;
    });

    // Get recent notifications (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const recent = await prisma.notification.count({
      where: {
        ...whereClause,
        createdAt: {
          gte: oneDayAgo
        }
      }
    });

    const stats = {
      total,
      unread,
      byType,
      recent
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error("Error fetching notification stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification statistics" },
      { status: 500 }
    );
  }
}