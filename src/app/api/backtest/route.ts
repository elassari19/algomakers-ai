import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/backtest?symbol=BTCUSD&timeframe=1H
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const timeframe = searchParams.get('timeframe');

  // If symbol and timeframe are provided, fetch one; else, fetch all
  if (symbol && timeframe) {
    try {
      const pair = await prisma.pair.findFirst({
        where: { symbol, timeframe },
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
  } else {
    // Fetch all pairs
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
}

// POST /api/backtest
export async function POST(request: Request) {
  const body = await request.json();
  const {
    symbol,
    metrics,
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

  if (!symbol || !timeframe) {
    return NextResponse.json(
      { error: 'Missing symbol or timeframe' },
      { status: 400 }
    );
  }

  try {
    const pair = await prisma.pair.create({
      data: {
        symbol,
        metrics,
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
export async function PATCH(request: Request) {
  const body = await request.json();
  const {
    id,
    symbol,
    metrics,
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

  if (!id) {
    return NextResponse.json({ error: 'Missing pair id' }, { status: 400 });
  }

  try {
    const pair = await prisma.pair.update({
      where: { id },
      data: {
        symbol,
        metrics,
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
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing pair id' }, { status: 400 });
  }
  try {
    await prisma.pair.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
