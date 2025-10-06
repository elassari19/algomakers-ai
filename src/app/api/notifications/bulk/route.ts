import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/generated/prisma";

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