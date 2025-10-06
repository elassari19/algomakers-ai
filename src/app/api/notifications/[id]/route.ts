import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";

// GET /api/notifications/[id] - Get specific notification
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
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
      existingNotification.userId === user.id || // User's own notification
      existingNotification.adminId === user.id || // Admin's notification
      (user.role === Role.ADMIN || user.role === Role.MANAGER); // Admin/Manager can update all

    if (!canUpdate) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // For regular users, only allow updating isRead status
    let updateData: any = {};
    
    if (user.role === Role.USER) {
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

    return NextResponse.json(updatedNotification);

  } catch (error) {
    console.error("Error updating notification:", error);
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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
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
      existingNotification.userId === user.id || // User's own notification
      (user.role === Role.ADMIN || user.role === Role.MANAGER); // Admin/Manager can delete all

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    return NextResponse.json({ message: "Notification deleted successfully" });

  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}