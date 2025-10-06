import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';

// GET /api/backtest?symbol=BTCUSD&timeframe=1H
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe');
  const strategy = searchParams.get('strategy');

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

  // If symbol and timeframe are provided, fetch one
  if (symbol && timeframe) {
    try {
      const whereClause: any = { 
        symbol, 
        timeframe
      };
      
      // Only add strategy to where clause if it's provided
      if (strategy !== null && strategy !== undefined && strategy !== '') {
        whereClause.strategy = strategy;
      } else {
        // If no strategy provided, find pairs where strategy is null or empty
        whereClause.strategy = null;
      }
      
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
      strategy,
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

    if (!symbol || !timeframe || !strategy) {
      return NextResponse.json(
        { error: 'Missing symbol, timeframe or strategy' },
        { status: 400 }
      );
    }

    const pair = await prisma.pair.create({
      data: {
        symbol,
        performance,
        strategy,
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
        action: AuditAction.CREATE_PAIR,
        targetType: AuditTargetType.PAIR,
        targetId: pair.id,
        details: {
          symbol: pair.symbol,
          timeframe: pair.timeframe,
          strategy: pair.strategy,
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
            strategy: pair.strategy,
            userRole: session.user.role,
            user: session.user.name,
            userEmail: session.user.email
          },
        },
      });
    }

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
      strategy,
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

    // Find the pair first to get its ID, then update by ID
    const whereClause: any = { 
      symbol, 
      timeframe
    };
    
    // Only add strategy to where clause if it's provided and not empty
    if (strategy !== null && strategy !== undefined && strategy !== '') {
      whereClause.strategy = strategy;
    } else {
      // If no strategy provided, find pairs where strategy is null or empty
      whereClause.strategy = null;
    }
    
    const existingPair = await prisma.pair.findFirst({
      where: whereClause,
    });
    console.log('Existing pair found:', existingPair);

    if (!existingPair) {
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }

    const pair = await prisma.pair.update({
      where: { id: existingPair.id },
      data: {
        symbol,
        performance,
        strategy,
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
