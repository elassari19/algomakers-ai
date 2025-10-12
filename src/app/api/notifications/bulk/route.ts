import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";
import { createAuditLog, AuditAction, AuditTargetType } from "@/lib/audit";

// PATCH /api/notifications/bulk - Bulk update notifications
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user;
    const body = await request.json();
    const { action, ids, isRead } = body;

    // Check if user has admin privileges for bulk operations
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array is required" },
        { status: 400 }
      );
    }

    if (action === 'markAsRead') {
      if (typeof isRead !== 'boolean') {
        return NextResponse.json(
          { error: "isRead boolean is required for markAsRead action" },
          { status: 400 }
        );
      }

      const updated = await prisma.notification.updateMany({
        where: {
          id: { in: ids }
        },
        data: {
          isRead: isRead
        }
      });

      // Log based on user role: ADMIN/MANAGER -> audit, other roles -> event
      await createAuditLog({
        actorId: user.id,
        actorRole: user.role as Role,
        action: AuditAction.UPDATE_NOTIFICATION,
        targetType: AuditTargetType.NOTIFICATION,
        targetId: ids[0] || 'bulk-operation',
        responseStatus: 'SUCCESS',
        details: {
          action: 'markAsRead',
          targetIds: ids,
          affectedCount: updated.count,
          newReadStatus: isRead,
          adminRole: user.role,
          adminEmail: user.email,
          bulkOperationType: 'UPDATE_READ_STATUS',
          actionType: 'BULK_NOTIFICATION_UPDATE'
        }
      });

      return NextResponse.json({
        message: `${updated.count} notifications updated`,
        count: updated.count
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error in bulk notification update:", error);
    await createAuditLog({
      actorId: session?.user?.id || 'unknown',
      actorRole: session?.user?.role as Role || 'USER',
      action: AuditAction.UPDATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        reason: error instanceof Error ? error.message : 'Unknown error during bulk update',
        action: 'bulkUpdateAttempt',
        timestamp: new Date().toISOString(),
      }
    });
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/bulk - Bulk delete notifications
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user;
    const body = await request.json();
    const { ids } = body;

    // Check if user has admin privileges for bulk operations
    if (user.role !== Role.ADMIN && user.role !== Role.MANAGER) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "IDs array is required" },
        { status: 400 }
      );
    }

    const deleted = await prisma.notification.deleteMany({
      where: {
        id: { in: ids }
      }
    });

    // Log based on user role: ADMIN/MANAGER -> audit, other roles -> event
    await createAuditLog({
      actorId: user.id,
      actorRole: user.role as Role,
      action: AuditAction.DELETE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      targetId: ids[0] || 'bulk-operation',
      responseStatus: 'SUCCESS',
      details: {
        action: 'bulkDelete',
        targetIds: ids,
        deletedCount: deleted.count,
        requestedCount: ids.length,
        adminRole: user.role,
        adminEmail: user.email,
        bulkOperationType: 'DELETE_NOTIFICATIONS',
        actionType: 'BULK_NOTIFICATION_DELETE'
      }
    });

    return NextResponse.json({
      message: `${deleted.count} notifications deleted`,
      count: deleted.count
    });

  } catch (error) {
    console.error("Error in bulk notification deletion:", error);
    await createAuditLog({
      actorId: session?.user?.id || 'unknown',
      actorRole: session?.user?.role as Role || 'USER',
      action: AuditAction.DELETE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      responseStatus: 'FAILURE',
      details: {
        reason: error instanceof Error ? error.message : 'Unknown error during bulk delete',
        action: 'bulkDeleteAttempt',
        timestamp: new Date().toISOString(),
      }
    });
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}