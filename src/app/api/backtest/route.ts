import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { upsertFileMetricsStats, deleteFileMetricsStats } from '../../../lib/stats-service';

// Helper function to create file metrics stats using shared service
const createFileMetricsStats = async (pairId: string, pairData: any) => {
  try {
    // Extract basic metrics from the pair data
    let initialCapital = 0;
    let netProfit = 0;
    let roi = 0;
    const properties = JSON.parse(pairData.properties);
    const performance = JSON.parse(pairData.performance);

    // Extract from properties
    try {
      initialCapital = properties[113]?.value;
      netProfit = performance[1]['All USDT'];
      roi = (performance[1]['All USDT'] / properties[113]?.value) * 100;
    } catch (e) {
      console.warn('Failed to parse properties JSON:', e);
    }

    // Prepare stats data
    const statsData = {
      pairId,
      initialCapital,
      netProfit,
      roi,
      symbol: pairData.symbol,
      timeframe: pairData.timeframe,
      version: pairData.version,
    };
    
    console.log('Creating/updating file metrics stats:', statsData);
    
    // Use shared service instead of HTTP call
    const result = await upsertFileMetricsStats(statsData);
    return result;
  } catch (error) {
    console.error('Error creating file metrics stats:', {
      message: error instanceof Error ? error.message : String(error),
      error: error
    });
    // Don't throw - let the main operation continue
  }
};

// GET /api/backtest?symbol=BTCUSD&timeframe=1H
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe');
  const version = searchParams.get('version');

  // If id is provided, fetch by id
  if (id) {
    try {
      const pair = await prisma.pair.findUnique({ where: { id } });
      if (!pair) {
        return NextResponse.json({ found: false });
      }
      return NextResponse.json({ found: true, pair });
    } catch (error) {
      console.error('Error fetching backtest by id:', error);
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as any).message
          : String(error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // If symbol, timeframe and version are provided, fetch one
  if (symbol && timeframe && version !== undefined) {
    try {
      const whereClause: any = { 
        symbol, 
        timeframe,
        version: version || null  // Use the version as-is, or null if empty/undefined
      };
      
      const pair = await prisma.pair.findFirst({
        where: whereClause,
      });
      
      if (!pair) {
        return NextResponse.json({ found: false });
      }
      return NextResponse.json({ found: true, pair });
    } catch (error) {
      console.error('Error checking backtest:', error);
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as any).message
          : String(error);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Else, fetch all pairs
  try {
    const pairs = await prisma.pair.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ pairs });
  } catch (error) {
    console.error('Error fetching all backtests:', error);
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/backtest
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      symbol,
      performance,
      version,
      tradesAnalysis,
      riskPerformanceRatios,
      listOfTrades,
      properties,
      priceOneMonth,
      priceThreeMonths,
      priceSixMonths,
      priceTwelveMonths,
      discountOneMonth,
      discountThreeMonths,
      discountSixMonths,
      discountTwelveMonths,
      timeframe,
    } = body;

    // Parse all price/discount fields as float
    const parseNum = (v: any) =>
      v === '' || v === null || typeof v === 'undefined' ? 0 : parseFloat(v);

    if (!symbol || !timeframe || !version) {
      return NextResponse.json(
        { error: 'Missing symbol, timeframe or version' },
        { status: 400 }
      );
    }

    const pair = await prisma.pair.create({
      data: {
        symbol,
        performance,
        version,
        tradesAnalysis,
        riskPerformanceRatios,
        listOfTrades,
        properties,
        priceOneMonth: parseNum(priceOneMonth),
        priceThreeMonths: parseNum(priceThreeMonths),
        priceSixMonths: parseNum(priceSixMonths),
        priceTwelveMonths: parseNum(priceTwelveMonths),
        discountOneMonth: parseNum(discountOneMonth),
        discountThreeMonths: parseNum(discountThreeMonths),
        discountSixMonths: parseNum(discountSixMonths),
        discountTwelveMonths: parseNum(discountTwelveMonths),
        timeframe,
      },
    });

    // Log based on user role: USER -> audit, non-USER -> event
    if (session.user.role && pair) {
      // Create audit log for USER role
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.CREATE_PAIR,
        targetType: AuditTargetType.PAIR,
        targetId: pair.id,
        details: {
          symbol: pair.symbol,
          timeframe: pair.timeframe,
          version: pair.version,
          userEmail: session.user.email,
          user: session.user.name
        },
      });
    } else {
      // Create event for non-USER roles
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'BACKTEST_CREATED',
          metadata: {
            pairId: pair.id,
            symbol: pair.symbol,
            timeframe: pair.timeframe,
            version: pair.version,
            userRole: session.user.role,
            user: session.user.name,
            userEmail: session.user.email
          },
        },
      });
    }

    // Create/update file metrics stats entry
    await createFileMetricsStats(pair.id, pair);

    return NextResponse.json({ success: true, pair });
  } catch (error) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/backtest
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Body received in PATCH /api/backtest:', body);
    const {
      symbol,
      timeframe,
      version,
      performance,
      tradesAnalysis,
      riskPerformanceRatios,
      listOfTrades,
      properties,
      priceOneMonth,
      priceThreeMonths,
      priceSixMonths,
      priceTwelveMonths,
      discountOneMonth,
      discountThreeMonths,
      discountSixMonths,
      discountTwelveMonths,
    } = body;

    // Parse all price/discount fields as float
    const parseNum = (v: any) =>
      v === '' || v === null || typeof v === 'undefined' ? 0 : parseFloat(v);

    if (!symbol || !timeframe || version === undefined) {
      return NextResponse.json(
        { error: 'Missing symbol, timeframe or version' },
        { status: 400 }
      );
    }

    // Find the pair first to get its ID, then update by ID
    const whereClause: any = { 
      symbol, 
      timeframe,
      version: version || null  // Use the version as-is, or null if empty/undefined
    };
    
    const existingPair = await prisma.pair.findFirst({
      where: whereClause,
    });

    if (!existingPair) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }

    const pair = await prisma.pair.update({
      where: { id: existingPair.id },
      data: {
        symbol,
        performance,
        version,
        tradesAnalysis,
        riskPerformanceRatios,
        listOfTrades,
        properties,
        priceOneMonth: parseNum(priceOneMonth),
        priceThreeMonths: parseNum(priceThreeMonths),
        priceSixMonths: parseNum(priceSixMonths),
        priceTwelveMonths: parseNum(priceTwelveMonths),
        discountOneMonth: parseNum(discountOneMonth),
        discountThreeMonths: parseNum(discountThreeMonths),
        discountSixMonths: parseNum(discountSixMonths),
        discountTwelveMonths: parseNum(discountTwelveMonths),
        timeframe,
      },
    });

    // Log based on user role: USER -> audit, non-USER -> event
    if (session.user.role) {
      // Create audit log for USER role
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.UPDATE_PAIR,
        targetType: AuditTargetType.PAIR,
        targetId: pair.id,
        details: {
          symbol: pair.symbol,
          timeframe: pair.timeframe,
          userEmail: session.user.email,
          user: session.user.name,
        },
      });
    } else {
      // Create event for non-USER roles
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'BACKTEST_UPDATED',
          metadata: {
            pairId: pair.id,
            symbol: pair.symbol,
            timeframe: pair.timeframe,
            userRole: session.user.role,
            user: session.user.name,
            userEmail: session.user.email
          },
        },
      });
    }

    // Update file metrics stats entry
    await createFileMetricsStats(pair.id, pair);

    return NextResponse.json({ success: true, pair });
  } catch (error) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/backtest?id=...
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing pair id' }, { status: 400 });
    }

    // Get pair info before deletion for logging
    const pairToDelete = await prisma.pair.findUnique({
      where: { id },
      select: { id: true, symbol: true, timeframe: true },
    });

    if (!pairToDelete) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }

    await prisma.pair.delete({ where: { id } });

    // Delete associated file metrics stats using shared service
    try {
      await deleteFileMetricsStats(id);
    } catch (statsError) {
      console.error('Error deleting file metrics stats:', statsError);
      // Don't fail the main operation if stats deletion fails
    }

    // Log based on user role: USER -> audit, non-USER -> event
    if (session.user.role) {
      // Create audit log for USER role
      await createAuditLog({
        adminId: session.user.id,
        action: AuditAction.DELETE_PAIR,
        targetType: AuditTargetType.PAIR,
        targetId: pairToDelete.id,
        details: {
          symbol: pairToDelete.symbol,
          timeframe: pairToDelete.timeframe,
          userEmail: session.user.email,
          user: session.user.name
        },
      });
    } else {
      // Create event for non-USER roles
      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventType: 'BACKTEST_DELETED',
          metadata: {
            pairId: pairToDelete.id,
            symbol: pairToDelete.symbol,
            timeframe: pairToDelete.timeframe,
            userRole: session.user.role,
            user: session.user.name,
            userEmail: session.user.email
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
