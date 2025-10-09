import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, StatsType } from "@/generated/prisma";
import { patchMetricsStats } from "@/lib/stats-service";
import { createAuditLog, AuditAction, AuditTargetType } from "@/lib/audit";

// PATCH /api/notifications/bulk - Bulk update notifications
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      if (user.role === Role.ADMIN || user.role === Role.MANAGER) {
        // Create audit log for ADMIN/MANAGER roles
        await createAuditLog({
          adminId: user.id,
          action: AuditAction.CREATE_NOTIFICATION,
          targetType: AuditTargetType.NOTIFICATION,
          targetId: ids[0] || 'bulk-operation',
          details: {
            action: 'markAsRead',
            targetIds: ids,
            affectedCount: updated.count,
            requestedCount: ids.length,
            newReadStatus: isRead,
            adminRole: user.role,
            adminEmail: user.email,
            bulkOperationType: 'UPDATE_READ_STATUS',
            actionType: 'BULK_NOTIFICATION_UPDATE'
          },
        });
      } else {
        // Create user event for other roles
        await prisma.event.create({
          data: {
            userId: user.id,
            eventType: 'BULK_NOTIFICATIONS_UPDATED',
            metadata: {
              action: 'markAsRead',
              targetIds: ids,
              affectedCount: updated.count,
              newReadStatus: isRead,
              userRole: user.role,
              timestamp: new Date().toISOString(),
            },
          },
        });
      }

      // Track bulk notification update stats
      try {
        await patchMetricsStats(StatsType.NOTIFICATION_METRICS, {
          id: user.id,
          adminEmail: user.email,
          adminRole: user.role,
          action: 'markAsRead',
          targetIds: ids,
          affectedCount: updated.count,
          newReadStatus: isRead,
          bulkOperationType: 'UPDATE_READ_STATUS',
          executedAt: new Date().toISOString(),
          type: 'BULK_NOTIFICATION_UPDATE'
        });
      } catch (statsError) {
        console.error('Failed to track bulk notification update stats:', statsError);
      }

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
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/bulk - Bulk delete notifications
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    if (user.role === Role.ADMIN || user.role === Role.MANAGER) {
      // Create audit log for ADMIN/MANAGER roles
      await createAuditLog({
        adminId: user.id,
        action: AuditAction.DELETE_NOTIFICATION,
        targetType: AuditTargetType.NOTIFICATION,
        targetId: ids[0] || 'bulk-operation',
        details: {
          action: 'bulkDelete',
          targetIds: ids,
          deletedCount: deleted.count,
          requestedCount: ids.length,
          adminRole: user.role,
          adminEmail: user.email,
          bulkOperationType: 'DELETE_NOTIFICATIONS',
          actionType: 'BULK_NOTIFICATION_DELETE'
        },
      });
    } else {
      // Create user event for other roles
      await prisma.event.create({
        data: {
          userId: user.id,
          eventType: 'BULK_NOTIFICATIONS_DELETED',
          metadata: {
            action: 'bulkDelete',
            targetIds: ids,
            deletedCount: deleted.count,
            requestedCount: ids.length,
            userRole: user.role,
            timestamp: new Date().toISOString(),
          },
        },
      });
    }

    // Track bulk notification deletion stats
    try {
      await patchMetricsStats(StatsType.NOTIFICATION_METRICS, {
        id: `bulk-delete-${user.id}-${Date.now()}`,
        adminUserId: user.id,
        adminEmail: user.email,
        adminRole: user.role,
        action: 'bulkDelete',
        targetIds: ids,
        deletedCount: deleted.count,
        requestedCount: ids.length,
        bulkOperationType: 'DELETE_NOTIFICATIONS',
        executedAt: new Date().toISOString(),
        type: 'BULK_NOTIFICATION_DELETE'
      });
    } catch (statsError) {
      console.error('Failed to track bulk notification deletion stats:', statsError);
    }

    return NextResponse.json({
      message: `${deleted.count} notifications deleted`,
      count: deleted.count
    });

  } catch (error) {
    console.error("Error in bulk notification deletion:", error);
    return NextResponse.json(
      { error: "Failed to delete notifications" },
      { status: 500 }
    );
  }
}