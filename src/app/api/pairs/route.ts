import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { z } from 'zod';

// Validation schema for pair creation/update
const pairSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  timeframe: z.string().min(1, 'Timeframe is required'),
  strategy: z.string().optional(),
  priceOneMonth: z.number().min(0),
  priceThreeMonths: z.number().min(0),
  priceSixMonths: z.number().min(0),
  priceTwelveMonths: z.number().min(0),
  discountOneMonth: z.number().min(0).max(100).default(0),
  discountThreeMonths: z.number().min(0).max(100).default(0),
  discountSixMonths: z.number().min(0).max(100).default(0),
  discountTwelveMonths: z.number().min(0).max(100).default(0),
});

// GET /api/pairs - Fetch all pairs with optional filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('q'); // Search query for symbol/timeframe/strategy
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const symbol = searchParams.get('symbol');
    const timeframe = searchParams.get('timeframe');

    // Build where clause for filtering
    const where: any = {};
    
    if (symbol) {
      where.symbol = {
        contains: symbol,
        mode: 'insensitive',
      };
    }
    
    if (timeframe) {
      where.timeframe = {
        contains: timeframe,
        mode: 'insensitive',
      };
    }

    // Add search functionality for symbol, timeframe, and strategy
    if (search && search.trim() !== '') {
      where.OR = [
        {
          symbol: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          timeframe: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
        {
          strategy: {
            contains: search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    // Fetch pairs with counts of related data
    const pairs = await prisma.pair.findMany({
      where,
      include: {
        _count: {
          select: {
            subscriptions: true,
            paymentItems: true,
          },
        },
      },
      orderBy: [
        { symbol: 'asc' },
        { timeframe: 'asc' },
      ],
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined,
    });

    // Get total count for pagination
    const totalCount = await prisma.pair.count({ where });

    return NextResponse.json({
      pairs,
      totalCount,
      hasMore: offset ? totalCount > parseInt(offset) + pairs.length : totalCount > pairs.length,
    });
  } catch (error) {
    console.error('Error fetching pairs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pairs' },
      { status: 500 }
    );
  }
}

// POST /api/pairs - Create a new pair
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = pairSchema.parse(body);

    // Check if pair with same symbol and timeframe already exists
    const existingPair = await prisma.pair.findFirst({
      where: {
        symbol: validatedData.symbol,
        timeframe: validatedData.timeframe,
      },
    });

    if (existingPair) {
      return NextResponse.json(
        { error: 'Pair with this symbol and timeframe already exists' },
        { status: 400 }
      );
    }

    const pair = await prisma.pair.create({
      data: {
        symbol: validatedData.symbol,
        timeframe: validatedData.timeframe,
        strategy: validatedData.strategy,
        priceOneMonth: validatedData.priceOneMonth,
        priceThreeMonths: validatedData.priceThreeMonths,
        priceSixMonths: validatedData.priceSixMonths,
        priceTwelveMonths: validatedData.priceTwelveMonths,
        discountOneMonth: validatedData.discountOneMonth,
        discountThreeMonths: validatedData.discountThreeMonths,
        discountSixMonths: validatedData.discountSixMonths,
        discountTwelveMonths: validatedData.discountTwelveMonths,
      },
    });

    // Log based on user role: non-USER -> audit, USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for admin roles
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.CREATE_PAIR,
        targetType: AuditTargetType.PAIR,
        targetId: pair.id,
        details: {
          symbol: pair.symbol,
          timeframe: pair.timeframe,
          strategy: pair.strategy,
          pricing: {
            oneMonth: pair.priceOneMonth,
            threeMonths: pair.priceThreeMonths,
            sixMonths: pair.priceSixMonths,
            twelveMonths: pair.priceTwelveMonths,
          },
          userEmail: session.user.email,
          user: session.user.name,
        },
      });
    } else {
      // Create event for USER role
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'PAIR_CREATED',
          metadata: {
            pairId: pair.id,
            symbol: pair.symbol,
            timeframe: pair.timeframe,
            strategy: pair.strategy,
            userRole: session.user.role,
            user: session.user.name,
            userEmail: session.user.email,
          },
        },
      });
    }

    return NextResponse.json({ pair }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating pair:', error);
    return NextResponse.json(
      { error: 'Failed to create pair' },
      { status: 500 }
    );
  }
}

// PUT /api/pairs - Update an existing pair
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Pair ID is required' },
        { status: 400 }
      );
    }

    const validatedData = pairSchema.partial().parse(updateData);

    // Check if pair exists
    const existingPair = await prisma.pair.findUnique({
      where: { id },
    });

    if (!existingPair) {
      return NextResponse.json(
        { error: 'Pair not found' },
        { status: 404 }
      );
    }

    // Check for duplicate symbol/timeframe if being updated
    if (validatedData.symbol || validatedData.timeframe) {
      const duplicatePair = await prisma.pair.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              symbol: validatedData.symbol || existingPair.symbol,
              timeframe: validatedData.timeframe || existingPair.timeframe,
            },
          ],
        },
      });

      if (duplicatePair) {
        return NextResponse.json(
          { error: 'Pair with this symbol and timeframe already exists' },
          { status: 400 }
        );
      }
    }

    const pair = await prisma.pair.update({
      where: { id },
      data: validatedData,
    });

    // Log based on user role: non-USER -> audit, USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for admin roles
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.UPDATE_PAIR,
        targetType: AuditTargetType.PAIR,
        targetId: pair.id,
        details: {
          updatedFields: validatedData,
          previousValues: {
            symbol: existingPair.symbol,
            timeframe: existingPair.timeframe,
            strategy: existingPair.strategy,
          },
          userEmail: session.user.email,
          user: session.user.name,
        },
      });
    } else {
      // Create event for USER role
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'PAIR_UPDATED',
          metadata: {
            pairId: pair.id,
            symbol: pair.symbol,
            timeframe: pair.timeframe,
            updatedFields: Object.keys(validatedData),
            userRole: session.user.role,
            user: session.user.name,
            userEmail: session.user.email,
          },
        },
      });
    }

    return NextResponse.json({ pair });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating pair:', error);
    return NextResponse.json(
      { error: 'Failed to update pair' },
      { status: 500 }
    );
  }
}

// DELETE /api/pairs - Delete a pair
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Pair ID is required' },
        { status: 400 }
      );
    }

    // Check if pair exists
    const existingPair = await prisma.pair.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            subscriptions: true,
            paymentItems: true,
          },
        },
      },
    });

    if (!existingPair) {
      return NextResponse.json(
        { error: 'Pair not found' },
        { status: 404 }
      );
    }

    // Check if pair has active subscriptions
    if (existingPair._count.subscriptions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete pair with active subscriptions' },
        { status: 400 }
      );
    }

    await prisma.pair.delete({
      where: { id },
    });

    // Log based on user role: non-USER -> audit, USER -> event
    if (session.user.role !== 'USER') {
      // Create audit log for admin roles
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.DELETE_PAIR,
        targetType: AuditTargetType.PAIR,
        targetId: id,
        details: {
          deletedPair: {
            symbol: existingPair.symbol,
            timeframe: existingPair.timeframe,
            strategy: existingPair.strategy,
            subscriptionCount: existingPair._count.subscriptions,
            paymentItemCount: existingPair._count.paymentItems,
          },
          userEmail: session.user.email,
          user: session.user.name,
        },
      });
    } else {
      // Create event for USER role
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'PAIR_DELETED',
          metadata: {
            pairId: id,
            symbol: existingPair.symbol,
            timeframe: existingPair.timeframe,
            strategy: existingPair.strategy,
            userRole: session.user.role,
            user: session.user.name,
            userEmail: session.user.email,
          },
        },
      });
    }

    return NextResponse.json({ message: 'Pair deleted successfully' });
  } catch (error) {
    console.error('Error deleting pair:', error);
    return NextResponse.json(
      { error: 'Failed to delete pair' },
      { status: 500 }
    );
  }
}