'use server';

import { authOptions } from '@/lib/auth';
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
  const session = await getServerSession(authOptions);
  const userIdFromSession = session?.user?.id;
  // Prefer an explicit userId passed via filters, otherwise fall back to the current session user
  const userId = filters.userId ?? userIdFromSession;
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

    // Build subscriptions include so we only include subscriptions for the resolved userId
    const subscriptionsInclude: any = {
      include: {
        payment: true,
      },
    };
    if (userId) {
      subscriptionsInclude.where = { userId };
    }

    // Fetch pairs with pagination
    const pairs = await prisma.pair.findMany({
      where,
      include: {
        subscriptions: subscriptionsInclude,
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
            priceOneMonth: true,
            priceThreeMonths: true,
            priceSixMonths: true,
            priceTwelveMonths: true,
            discountOneMonth: true,
            discountThreeMonths: true,
            discountSixMonths: true,
            discountTwelveMonths: true,
            createdAt: true,
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

export async function getSubscriptionDetails(subscriptionId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: subscriptionId,
      },
      include: {
        pair: {
          select: {
            id: true,
            symbol: true,
            version: true,
            timeframe: true,
            priceOneMonth: true,
            priceThreeMonths: true,
            priceSixMonths: true,
            priceTwelveMonths: true,
            discountOneMonth: true,
            discountThreeMonths: true,
            discountSixMonths: true,
            discountTwelveMonths: true,
            createdAt: true,
          },
        },
        payment: {
          include: {
            paymentItems: {
              include: {
                pair: {
                  select: {
                    id: true,
                    symbol: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            tradingviewUsername: true,
            createdAt: true,
          },
        },
        commissions: {
          include: {
            affiliate: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    return JSON.stringify(subscription);
  } catch (error) {
    console.error('Error fetching subscription details:', error);
    throw new Error('Failed to fetch subscription details');
  }
}

export async function getUserBillingData() {
  const session = await getServerSession(authOptions);
  try {
    const payments = await prisma.payment.findMany({
      where: {
        userId: session?.user?.id,
      },
      // include: {
      //   subscription: {
      //     select: {
      //       id: true,
      //       status: true,
      //       pair: {
      //         select: {
      //           id: true,
      //           symbol: true,
      //           version: true,
      //           timeframe: true,
      //         },
      //       },
      //     },
      //   },
      // },
    });

    return JSON.stringify(payments);
  } catch (error) {
    console.error('Error fetching user billing data:', error);
    throw new Error('Failed to fetch user billing data');
  }
}
