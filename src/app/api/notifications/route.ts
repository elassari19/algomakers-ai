import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationType, Role, StatsType } from "@/generated/prisma";
import { patchMetricsStats } from "@/lib/stats-service";
import { createAuditLog, AuditAction, AuditTargetType } from "@/lib/audit";

// GET /api/notifications - Fetch notifications for user or admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") as NotificationType;
    const isRead = searchParams.get("isRead");
    const adminView = searchParams.get("adminView") === "true";

    const skip = (page - 1) * limit;
    const user = session.user;

    // Build where clause based on user role and params
    let whereClause: any = {};

    if (adminView && (user.role === Role.ADMIN || user.role === Role.MANAGER || user.role === Role.SUPPORT)) {
      // Admin view - can see all notifications or admin-specific ones
      if (user.role === Role.SUPPORT) {
        // Support can only see general and non-sensitive notifications
        whereClause = {
          OR: [
            { 
              type: { 
                in: [NotificationType.GENERAL, NotificationType.RENEWAL_REMINDER] 
              } 
            }
          ]
        };
      }
    }

    // Add filters
    if (type) {
      whereClause.type = type;
    }

    if (isRead !== null && isRead !== undefined) {
      whereClause.isRead = isRead === "true";
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.notification.count({ where: whereClause })
    ]);
    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    await createAuditLog({
      actorId: 'unknown',
      actorRole: 'USER',
      action: AuditAction.GET_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        reason: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    const body = await request.json();
    const { userId, targetUsers, targetId, type, title, message, priority, channel, expiresAt, data } = body;

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "Type, title, and message are required" },
        { status: 400 }
      );
    }

    // Validate notification type
    if (!Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: "Invalid notification type" },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId: userId || null,
        targetUsers: targetUsers || [],
        targetId: targetId || null,
        type,
        title,
        message,
        data: data || null,
        priority: priority || 'MEDIUM',
        channel: channel || 'IN_APP',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Unified audit log for all roles
    await createAuditLog({
      actorId: user.id,
      actorRole: user.role as Role || 'USER',
      action: AuditAction.CREATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      targetId: notification.id,
      responseStatus: 'SUCCESS',
      details: {
        notificationId: notification.id,
        notificationType: type,
        notificationTitle: title,
        targetUserId: userId || null,
        targetUserEmail: notification.user?.email || null,
        creatorRole: user.role,
        creatorEmail: user.email,
        isSystemWide: !userId,
        hasData: !!data,
        messageLength: message.length,
        actionType: 'NOTIFICATION_CREATION',
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(notification, { status: 201 });

  } catch (error) {
    console.error("Error creating notification:", error);
    await createAuditLog({
      actorId: 'unknown',
      actorRole: 'USER',
      action: AuditAction.CREATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        reason: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/:id - Update a notification (admin/manager only)
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || (session.user.role !== Role.ADMIN && session.user.role !== Role.MANAGER)) {
    await createAuditLog({
      actorId: session?.user.id || 'unknown',
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.UPDATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        reason: 'unauthorized_access_attempt',
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { userId, targetUsers, targetId, title, message, data, type, priority, channel, expiresAt } = body;

    // Only allow updating certain fields
    const updateData: any = {};
    if (userId !== undefined) updateData.userId = userId;
    if (targetUsers !== undefined) updateData.targetUsers = targetUsers;
    if (targetId !== undefined) updateData.targetId = targetId;
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (data !== undefined) updateData.data = data;
    if (type !== undefined) {
      if (!Object.values(NotificationType).includes(type)) {
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
      }
      updateData.type = type;
    }
    if (priority !== undefined) updateData.priority = priority;
    if (channel !== undefined) updateData.channel = channel;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      }
    });

    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role,
      action: AuditAction.UPDATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      targetId: notification.id,
      responseStatus: 'SUCCESS',
      details: {
        updatedFields: Object.keys(updateData),
        notificationId: notification.id,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(notification);

  } catch (error) {
    console.error("Error updating notification:", error);
    await createAuditLog({
      actorId: session.user.id || 'unknown',
      actorRole: session.user.role as Role || 'USER',
      action: AuditAction.UPDATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        reason: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
    });
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}