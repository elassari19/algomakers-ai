import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { upsertFileMetricsStats, deleteFileMetricsStats } from '@/lib/stats-service';
import { Role } from '@/generated/prisma/wasm';

// Helper function to create file metrics stats using shared service
const createFileMetricsStats = async (pairId: string, pairData: any) => {
  const session = await getServerSession(authOptions);
  if (session?.user.role === 'USER') {
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role || 'USER',
      action: AuditAction.CREATE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      details: { reason: 'unauthorized_role' },
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
        
    const result = await upsertFileMetricsStats(statsData);
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.CREATE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      details: { 
        symbol: pairData.symbol,
        timeframe: pairData.timeframe,
        version: pairData.version,
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
      },
    });
    return result;
  } catch (error) {
    console.error('Error creating file metrics stats:', {
      message: error instanceof Error ? error.message : String(error),
      error: error
    });
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.CREATE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      responseStatus: 'FAILURE',
      details: {
        reason: error instanceof Error ? error.message : String(error),
        symbol: pairData.symbol,
        timeframe: pairData.timeframe,
        version: pairData.version,
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
      },
    });
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
      const pair = await prisma.pair.findUnique({ 
        where: { id },
        include: { subscriptions: true }
      });
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
        include: { subscriptions: true }
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
      include: { subscriptions: true }
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
  const session = await getServerSession(authOptions);

  if (session?.user?.id && session?.user?.role === 'USER') {
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role || 'USER',
      action: AuditAction.CREATE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      responseStatus: 'FAILURE',
      details: { reason: 'unauthorized_role' },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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

    // Check if pair with same symbol, version and timeframe already exists
    const existingPair = await prisma.pair.findFirst({
      where: {
        symbol: symbol,
        version: version,
        timeframe: timeframe,
      },
    });

    if (existingPair) {
      await createAuditLog({
        actorId: session?.user.id!,
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.CREATE_BACKTEST,
        targetType: AuditTargetType.BACKTEST,
        responseStatus: 'FAILURE',
        details: {
          reason: 'pair_already_exists',
          symbol: symbol,
          timeframe: timeframe,
          version: version,
          existingPairId: existingPair.id,
          userEmail: session?.user.email,
          user: session?.user.name,
          timestamp: new Date().toISOString(),
        },
      });
      return NextResponse.json(
        {
          error: 'Pair with same symbol, version and timeframe already exists',
          existingPair: {
            id: existingPair.id,
            symbol: existingPair.symbol,
            version: existingPair.version,
            timeframe: existingPair.timeframe,
          }
        },
        { status: 409 }
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
        priceOneMonth: 20,
        priceThreeMonths: 60,
        priceSixMonths: 120,
        priceTwelveMonths: 240,
        discountOneMonth: 5,
        discountThreeMonths: 5,
        discountSixMonths: 15,
        discountTwelveMonths: 20,
        timeframe,
      },
    });

    // Unified audit log for all roles
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.CREATE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      targetId: pair.id,
      responseStatus: 'SUCCESS',
      details: {
        symbol: pair.symbol,
        timeframe: pair.timeframe,
        version: pair.version,
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
      },
    });

    // Create/update file metrics stats entry
    await createFileMetricsStats(pair.id, pair);

    return NextResponse.json({ success: true, pair });
  } catch (error) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.CREATE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      responseStatus: 'FAILURE',
      details: { reason: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/backtest
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === 'USER') {
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role || 'USER',
      action: AuditAction.UPDATE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      responseStatus: 'FAILURE',
      details: { reason: 'unauthorized_role' },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {

    const body = await request.json();
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
      await createAuditLog({
        actorId: session?.user.id!,
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.UPDATE_BACKTEST,
        targetType: AuditTargetType.BACKTEST,
        responseStatus: 'FAILURE',
        details: {
          symbol: whereClause.symbol,
          timeframe: whereClause.timeframe,
          version: whereClause.version,
          reason: 'pair_not_found'
        },
      });
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

    // Unified audit log for all roles
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.UPDATE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      targetId: pair.id,
      responseStatus: 'SUCCESS',
      details: {
        symbol: pair.symbol,
        timeframe: pair.timeframe,
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
      },
    });

    // Update file metrics stats entry
    await createFileMetricsStats(pair.id, pair);

    return NextResponse.json({ success: true, pair });
  } catch (error) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.UPDATE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      responseStatus: 'FAILURE',
      details: { reason: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/backtest?id=...
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role === 'USER') {
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role || 'USER',
      action: AuditAction.DELETE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      responseStatus: 'FAILURE',
      details: { reason: 'unauthorized_role' },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
      await createAuditLog({
        actorId: session?.user.id!,
        actorRole: session?.user.role as Role || 'USER',
        action: AuditAction.DELETE_BACKTEST,
        targetType: AuditTargetType.BACKTEST,
        responseStatus: 'FAILURE',
        details: {
          pairId: id,
          reason: 'pair_not_found'
        },
      });
      return NextResponse.json({ error: 'Pair not found' }, { status: 404 });
    }

    try {
      await prisma.pair.delete({ where: { id } });
      await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.DELETE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      targetId: pairToDelete.id,
      responseStatus: 'SUCCESS',
      details: {
        symbol: pairToDelete.symbol,
        timeframe: pairToDelete.timeframe,
        userEmail: session?.user.email,
        user: session?.user.name,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.DELETE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      targetId: pairToDelete.id,
      responseStatus: 'FAILURE',
      details: { reason: String(error) },
    });
  }

    // Delete associated file metrics stats using shared service
    try {
      await deleteFileMetricsStats(id);
    } catch (statsError) {
      console.error('Error deleting file metrics stats:', statsError);
      // Don't fail the main operation if stats deletion fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    await createAuditLog({
      actorId: session?.user.id!,
      actorRole: session?.user.role as Role || 'USER',
      action: AuditAction.DELETE_BACKTEST,
      targetType: AuditTargetType.BACKTEST,
      responseStatus: 'FAILURE',
      details: { reason: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
