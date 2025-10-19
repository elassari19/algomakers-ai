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
    const { action, ids, ...updateFields } = body;

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

    let updateData: any = {};

    if (action === 'markAsRead') {
      // With current schema, "mark as read" means emptying targetUsers array
      // This indicates all targeted users have read the notification
      updateData.targetUsers = [];
    } else if (action === 'updateFields') {
      // Allow bulk updating of specific fields
      const allowedFields = ['priority', 'channel', 'expiresAt', 'type'];
      const filteredFields: any = {};

      for (const [key, value] of Object.entries(updateFields)) {
        if (allowedFields.includes(key)) {
          if (key === 'expiresAt' && value) {
            filteredFields[key] = new Date(value as string);
          } else {
            filteredFields[key] = value;
          }
        }
      }

      if (Object.keys(filteredFields).length === 0) {
        return NextResponse.json(
          { error: "No valid fields to update" },
          { status: 400 }
        );
      }

      updateData = filteredFields;
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'markAsRead' or 'updateFields'" },
        { status: 400 }
      );
    }

    const updated = await prisma.notification.updateMany({
      where: {
        id: { in: ids }
      },
      data: updateData
    });

    // Log based on user role: ADMIN/MANAGER -> audit
    await createAuditLog({
      actorId: user.id,
      actorRole: user.role as Role,
      action: AuditAction.UPDATE_NOTIFICATION,
      targetType: AuditTargetType.NOTIFICATION,
      targetId: ids[0] || 'bulk-operation',
      responseStatus: 'SUCCESS',
      details: {
        action: action,
        targetIds: ids,
        affectedCount: updated.count,
        updateData: updateData,
        adminRole: user.role,
        adminEmail: user.email,
        bulkOperationType: action === 'markAsRead' ? 'MARK_ALL_READ' : 'UPDATE_FIELDS',
        actionType: 'BULK_NOTIFICATION_UPDATE'
      }
    });

    return NextResponse.json({
      message: `${updated.count} notifications updated`,
      count: updated.count
    });

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