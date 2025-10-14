'use server';

import { prisma } from '@/lib/prisma';

interface GetPairsFilters {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
  hasSubscription?: boolean;
}

export async function getPairs(filters: GetPairsFilters = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      q,
      type,
      hasSubscription,
    } = filters;

    // Build where clause
    const where: any = {};

    if (q) {
      where.OR = [
        {
          symbol: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          version: {
            contains: q,
            mode: 'insensitive',
          },
        },
        {
          timeframe: {
            contains: q,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (hasSubscription !== undefined) {
      if (hasSubscription) {
        where.subscriptions = {
          some: {
            status: 'active',
          },
        };
      } else {
        where.subscriptions = {
          none: {},
        };
      }
    }

    const skip = (page - 1) * limit;

    // Fetch pairs with pagination
    const pairs = await prisma.pair.findMany({
      where,
      select: {
        id: true,
        symbol: true,
        version: true,
        createdAt: true,
        discountOneMonth: true,
        discountSixMonths: true,
        discountThreeMonths: true,
        discountTwelveMonths: true,
        priceOneMonth: true,
        priceSixMonths: true,
        priceThreeMonths: true,
        priceTwelveMonths: true,
        timeframe: true,
        updatedAt: true,
        performance: true,
        properties: true,
        riskPerformanceRatios: true,
        tradesAnalysis: true,
        subscriptions: true,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get total count for pagination
    const total = await prisma.pair.count({ where });

    return {
      pairs: JSON.parse(JSON.stringify(pairs)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error('Error fetching pairs:', error);
    throw new Error('Failed to fetch pairs');
  }
}

export async function getBacktest(id: string) {
  try {
    const res = await prisma.pair.findUnique({
      where: { id },
      include: {
        subscriptions: true,
      }
    });
    return JSON.parse(JSON.stringify(res));
  } catch (error) {
    console.error('Error fetching backtest:', error);
    throw new Error('Failed to fetch backtest');
  }
}
