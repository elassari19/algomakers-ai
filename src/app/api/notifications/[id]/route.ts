import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";
import { AuditAction, AuditTargetType, createAuditLog } from "@/lib/audit";

// GET /api/notifications/[id] - Get specific notification
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user;
    const params = await context.params;
    const notificationId = params.id;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        admin: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const canAccess = 
      notification.userId === user.id || // User's own notification
      notification.adminId === user.id || // Admin's notification
      (user.role === Role.ADMIN || user.role === Role.MANAGER); // Admin/Manager can see all

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(notification);

  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification" },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/[id] - Update notification (mainly for marking as read)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === Role.USER) {
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role || 'USER',
      action: AuditAction.UPDATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        reason: 'Regular users cannot update notifications except marking as read',
        action: 'updateAttempt',
        timestamp: new Date().toISOString(),
      }
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await context.params;
    const notificationId = params.id;
    const body = await request.json();

    // First, get the notification to check permissions
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Check permissions
    const canUpdate =
      existingNotification.userId === session?.user.id || // User's own notification
      existingNotification.adminId === session?.user.id || // Admin's notification
      (session?.user.role === Role.ADMIN || session?.user.role === Role.MANAGER); // Admin/Manager can update all

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For regular users, only allow updating isRead status
    let updateData: any = {};

    if (session?.user.role === Role.USER) {
      if (body.isRead !== undefined) {
        updateData.isRead = body.isRead;
      }
    } else {
      // Admins can update more fields
      if (body.isRead !== undefined) updateData.isRead = body.isRead;
      if (body.title) updateData.title = body.title;
      if (body.message) updateData.message = body.message;
      if (body.data !== undefined) updateData.data = body.data;
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        admin: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    await createAuditLog({
      actorId: session.user.id || 'unknown',
      actorRole: session.user.role as Role || 'USER',
      action: AuditAction.UPDATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      targetId: notificationId,
      responseStatus: 'SUCCESS',
      details: {
        action: 'update',
        updatedFields: Object.keys(updateData),
        notificationId: notificationId,
        timestamp: new Date().toISOString(),
      }
    });

    return NextResponse.json(updatedNotification);

  } catch (error) {
    console.error("Error updating notification:", error);
    await createAuditLog({
      actorId: session?.user.id || 'unknown',
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.UPDATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        action: 'update',
        timestamp: new Date().toISOString(),
      }
    });
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role === Role.USER) {
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role || 'USER',
      action: AuditAction.DELETE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        reason: 'Regular users cannot delete notifications',
        action: 'deleteAttempt',
        timestamp: new Date().toISOString(),
      }
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const params = await context.params;
    const notificationId = params.id;

    // First, get the notification to check permissions
    const existingNotification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!existingNotification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    // Only admins and managers can delete notifications, or users can delete their own
    const canDelete =
      existingNotification.userId === session?.user.id || // User's own notification
      (session?.user.role === Role.ADMIN || session?.user.role === Role.MANAGER); // Admin/Manager can delete all

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });
    await createAuditLog({
      actorId: session.user.id || 'unknown',
      actorRole: session.user.role as Role || 'USER',
      action: AuditAction.DELETE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      targetId: notificationId,
      responseStatus: 'SUCCESS',
      details: {
        action: 'delete',
        notificationId: notificationId,
        timestamp: new Date().toISOString(),
      }
    });

    return NextResponse.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    await createAuditLog({
      actorId: session?.user.id || 'unknown',
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.DELETE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        action: 'delete',
        timestamp: new Date().toISOString(),
      }
    });
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}