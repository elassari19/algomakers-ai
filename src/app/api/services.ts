'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

interface GetPairsFilters {
  page?: number;
  limit?: number;
  q?: string;
  type?: string;
  userId?: string; // Add userId to filter subscriptions by user
}

export async function getPairs(filters: GetPairsFilters = {}) {
  const session = await getServerSession();
  const userId = session?.user?.id;
  try {
    const {
      page = 1,
      limit = 20,
      q,
      type,
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

    const skip = (page - 1) * limit;

    // Fetch pairs with pagination
    const pairs = await prisma.pair.findMany({
      where,
      include: {
        subscriptions: {
          where: { userId },
        },
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

export async function getUserSubscriptions(userId: string) {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PENDING'] },
      },
      include: {
        pair: true,
        payment: true,
      },
    });

    return JSON.parse(JSON.stringify(subscriptions));
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    throw new Error('Failed to fetch user subscriptions');
  }
}

export async function getUserSubscriptionPairs(userId: string) {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId,
      },
      include: {
        pair: {
          select: {
            id: true,
            symbol: true,
            version: true,
            timeframe: true,
            paymentItems: true,
          },
        },
        payment: true,
        commissions: true,
      },
    });

    return JSON.stringify(subscriptions);
  } catch (error) {
    console.error('Error fetching user subscription pairs:', error);
    throw new Error('Failed to fetch user subscription pairs');
  }
}
