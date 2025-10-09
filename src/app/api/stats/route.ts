/**
 * DYNAMIC STATS API ROUTE
 * use patchMetricsStats function from /lib/stats-service.ts to patch stats
 * ======================
 * 
 * This is a generic, reusable stats API that can be used by any route in the application.
 * It accepts dynamic statsType and metadata to store and retrieve various types of statistics.
 * 
 * USAGE EXAMPLES:
 * ===============
 * 
 * 1. SAVE STATS (POST):
 *    POST /api/affiliates/stats
 *    Body: {
 *      "type": "FILE_METRICS",                   // Required: Any StatsType enum value
 *      "data": { "id": "file_id", "netProfit": 1500, "trades": 12 }  // Required: Single object with id
 *    }
 *    // OR with metadata array (legacy support):
 *    Body: {
 *      "statsType": "AFFILIATE",                 // Required: Any StatsType enum value
 *      "metadata": [                             // Required: Array of objects (any structure)
 *        { "id": "affiliate-1", "totalEarnings": 1500, "commissions": 12 },
 *        { "id": "affiliate-2", "totalEarnings": 2800, "commissions": 25 }
 *      ]
 *    }
 * 
 * 2. RETRIEVE STATS (GET):
 *    GET /api/affiliates/stats?type=AFFILIATE
 *    Parameters:
 *    - type (required): StatsType enum value
 * 
 * 3. UPDATE STATS (PATCH):
 *    PATCH /api/affiliates/stats
 *    Body: {
 *      "type": "FILE_METRICS",                   // Required: StatsType to update
 *      "data": { "id": "file_id", "netProfit": 2000, "trades": 15 }  // Required: Object with id to update
 *    }
 *    // This will find the item in metadata array with matching id and update it
 *    // If no item with that id exists, it will add the new item to the array
 * 
 * 4. DELETE STATS (DELETE):
 *    DELETE /api/affiliates/stats?id=specific-id
 *    OR
 *    DELETE /api/affiliates/stats?type=AFFILIATE
 * 
 * AVAILABLE ENUM VALUES:
 * ======================
 * StatsType: AFFILIATE , COMMISSION, REFERRAL , USERS etc.
 * 
 * FEATURES:
 * =========
 * - ✅ Dynamic metadata: Accepts array of objects with any structure
 * - ✅ Auto-enrichment: Adds timestamps automatically
 * - ✅ Flexible identification: Custom or auto-generated IDs
 * - ✅ Comprehensive validation and error handling
 * - ✅ Admin-only access with proper authentication
 * 
 * INTEGRATION EXAMPLES:
 * ====================
 * 
 * // In other API routes:
 * const saveUserStats = async (userData) => {
 *   await fetch('/api/affiliates/stats', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       statsType: 'USER_REGISTRATION',
 *       metadata: [
 *         { type: 'total', count: userData.totalCount, date: '2025-10-08' },
 *         { type: 'premium', count: userData.premium, revenue: 15000 },
 *         { type: 'free', count: userData.free, conversionRate: 0.12 }
 *       ]
 *     })
 *   });
 * };
 * 
 * // Retrieve stats in components:
 * const getAffiliateStats = async () => {
 *   const response = await fetch('/api/affiliates/stats?type=AFFILIATE');
 *   const stats = await response.json();
 *   return stats.data;
 * };
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatsType, StatsPeriod } from '@/generated/prisma';

// Generic Stats API - Reusable by all routes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role === 'USER') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statsType = searchParams.get('type') as StatsType;

    if (!statsType) {
      return NextResponse.json(
        { message: 'Stats type is required. Use ?type=STATS_TYPE' },
        { status: 400 }
      );
    }

    const statsRecord = await prisma.stats.findMany({
      where: { type: statsType },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: statsRecord
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST method to save/calculate stats dynamically
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role === 'USER') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, data, statsType, metadata, id } = body;

    // Support both new format (type + data) and legacy format (statsType + metadata)
    const finalStatsType = type || statsType;
    let finalMetadata;

    if (type && data) {
      // New format: single data object
      if (!data.id) {
        return NextResponse.json(
          { message: 'data object must contain an id field' },
          { status: 400 }
        );
      }
      finalMetadata = [data];
    } else if (statsType && metadata) {
      // Legacy format: metadata array
      if (!Array.isArray(metadata)) {
        return NextResponse.json(
          { message: 'metadata must be an array of objects' },
          { status: 400 }
        );
      }
      finalMetadata = metadata;
    } else {
      return NextResponse.json(
        { message: 'Either (type and data) or (statsType and metadata) are required' },
        { status: 400 }
      );
    }

    // Validate statsType
    if (!Object.values(StatsType).includes(finalStatsType)) {
      return NextResponse.json(
        { message: `Invalid statsType. Valid types: ${Object.values(StatsType).join(', ')}` },
        { status: 400 }
      );
    }

    // Add timestamp to metadata array
    const now = new Date();

    // Store or update stats
    const savedStats = await prisma.stats.upsert({
      where: { id },
      update: {
        type: finalStatsType,
        metadata: finalMetadata,
        updatedAt: now
      },
      create: {
        id,
        type: finalStatsType,
        metadata: finalMetadata
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Stats saved successfully',
      data: {
        id: savedStats.id,
        type: savedStats.type,
        metadata: savedStats.metadata,
        createdAt: savedStats.createdAt,
        updatedAt: savedStats.updatedAt
      }
    });

  } catch (error) {
    console.error('Error saving stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT method to update existing stats
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role === 'USER') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { statsType, data } = body;

    if (statsType) {
      return NextResponse.json(
        { message: 'Either Stats ID or type/statsType is required' },
        { status: 400 }
      );
    }

    const now = new Date();
    let updatedStats;

      // Update by statsType - find most recent record and update specific item
      const existingStats = await prisma.stats.findFirst({
        where: { type: statsType },
        orderBy: { updatedAt: 'desc' }
      });

      if (!existingStats) {
        return NextResponse.json(
          { message: `No stats found with type: ${statsType}` },
          { status: 404 }
        );
      }

      let updatedMetadata;

      if (statsType && data) {
        // New format: update specific item by id
        if (!data.id) {
          return NextResponse.json(
            { message: 'data object must contain an id field' },
            { status: 400 }
          );
        }

        const currentMetadata = Array.isArray(existingStats.metadata) ? existingStats.metadata : [];
        const itemIndex = currentMetadata.findIndex((item: any) => item.id === data.id);

        if (itemIndex >= 0) {
          // Update existing item
          updatedMetadata = [...currentMetadata];
          updatedMetadata[itemIndex] =
            (typeof updatedMetadata[itemIndex] === 'object' && updatedMetadata[itemIndex] !== null && typeof data === 'object' && data !== null)
              ? { ...updatedMetadata[itemIndex], ...data }
              : data;
        } else {
          // Add new item if not found
          updatedMetadata = [...currentMetadata, data];
        }
      } else if (data) {
        // Legacy format: replace entire data array
        if (!Array.isArray(data)) {
          return NextResponse.json(
            { message: 'metadata must be an array of objects' },
            { status: 400 }
          );
        }
        updatedMetadata = data;
      } else {
        return NextResponse.json(
          { message: 'Either data object or metadata array is required' },
          { status: 400 }
        );
      }

      updatedStats = await prisma.stats.update({
        where: { id: existingStats.id },
        data: {
          metadata: updatedMetadata,
          updatedAt: now
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Stats updated successfully',
      data: updatedStats
    });

  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
      return NextResponse.json(
        { message: 'Stats not found' },
        { status: 404 }
      );
    }
    
    console.error('Error updating stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE method to remove stats
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const statsType = searchParams.get('type') as StatsType;

    if (!id && !statsType) {
      return NextResponse.json(
        { message: 'Either ID or both statsType and period are required' },
        { status: 400 }
      );
    }

    if (id) {
      // Delete by ID
      await prisma.stats.delete({
        where: { id }
      });
    } else {
      // Delete by type and period
      await prisma.stats.deleteMany({
        where: {
          type: statsType,
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Stats deleted successfully'
    });

  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
      return NextResponse.json(
        { message: 'Stats not found' },
        { status: 404 }
      );
    }
    
    console.error('Error deleting stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}