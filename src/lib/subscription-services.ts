'use server'

import { prisma } from './prisma';

// Types for the service functions
export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
}

export interface PairSearchResult {
  id: string;
  symbol: string;
  timeframe: string;
  version: string;
}

/**
 * Search users by name or email
 * @param query - Search query string
 * @param limit - Maximum number of results to return
 * @returns Array of user search results
 */
export async function searchUsers(query: string, limit: number = 10): Promise<UserSearchResult[]> {
  try {
    const users = await prisma.user.findMany({
      where: query ? {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      } : {},
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: limit,
      orderBy: [
        { name: 'asc' },
        { email: 'asc' },
      ],
    });

    return users.map(user => ({
      id: user.id,
      name: user.name || 'No Name',
      email: user.email,
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }
}

/**
 * Search trading pairs by symbol, timeframe, or version
 * @param query - Search query string
 * @param limit - Maximum number of results to return
 * @returns Array of pair search results
 */
export async function searchPairs(query: string, limit: number = 10): Promise<PairSearchResult[]> {
  try {
    const pairs = await prisma.pair.findMany({
      where: query ? {
        OR: [
          {
            symbol: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            timeframe: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            version: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      } : {},
      select: {
        id: true,
        symbol: true,
        timeframe: true,
        version: true,
      },
      take: limit,
      orderBy: [
        { symbol: 'asc' },
        { timeframe: 'asc' },
      ],
    });

    return pairs.map(pair => ({
      id: pair.id,
      symbol: pair.symbol,
      timeframe: pair.timeframe,
      version: pair.version || 'No Version',
    }));
  } catch (error) {
    console.error('Error searching pairs:', error);
    throw new Error('Failed to search pairs');
  }
}

/**
 * Get all users (for initial dropdown population)
 * @param limit - Maximum number of results to return
 * @returns Array of all users
 */
export async function getAllUsers(limit: number = 50): Promise<UserSearchResult[]> {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: limit,
      orderBy: [
        { name: 'asc' },
        { email: 'asc' },
      ],
    });

    return users.map(user => ({
      id: user.id,
      name: user.name || 'No Name',
      email: user.email,
    }));
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw new Error('Failed to fetch users');
  }
}

/**
 * Get all trading pairs (for initial dropdown population)
 * @param limit - Maximum number of results to return
 * @returns Array of all pairs
 */
export async function getAllPairs(limit: number = 50): Promise<PairSearchResult[]> {
  try {
    const pairs = await prisma.pair.findMany({
      select: {
        id: true,
        symbol: true,
        timeframe: true,
        version: true,
      },
      take: limit,
      orderBy: [
        { symbol: 'asc' },
        { timeframe: 'asc' },
      ],
    });

    return pairs.map(pair => ({
      id: pair.id,
      symbol: pair.symbol,
      timeframe: pair.timeframe,
      version: pair.version || 'No Version',
    }));
  } catch (error) {
    console.error('Error fetching all pairs:', error);
    throw new Error('Failed to fetch pairs');
  }
}

/**
 * Get user by ID
 * @param userId - User ID
 * @returns User details or null if not found
 */
export async function getUserById(userId: string): Promise<UserSearchResult | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name || 'No Name',
      email: user.email,
    };
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error('Failed to fetch user');
  }
}

/**
 * Get pair by ID
 * @param pairId - Pair ID
 * @returns Pair details or null if not found
 */
export async function getPairById(pairId: string): Promise<PairSearchResult | null> {
  try {
    const pair = await prisma.pair.findUnique({
      where: { id: pairId },
      select: {
        id: true,
        symbol: true,
        timeframe: true,
        version: true,
      },
    });

    if (!pair) return null;

    return {
      id: pair.id,
      symbol: pair.symbol,
      timeframe: pair.timeframe,
      version: pair.version || 'No Version',
    };
  } catch (error) {
    console.error('Error fetching pair by ID:', error);
    throw new Error('Failed to fetch pair');
  }
}

/**
 * Create multiple subscriptions from form data
 * @param data - Subscription form data
 * @returns Array of created subscription IDs
 */
export async function createSubscriptions(data: {
  userId: string;
  startDate: string;
  pairs: Array<{
    pairId: string;
    period: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS';
    endDate: string;
    basePrice?: string;
    discountRate?: string;
  }>;
}): Promise<string[]> {
  try {
    const subscriptionIds: string[] = [];

    // Create subscriptions in a transaction
    await prisma.$transaction(async (tx) => {
      for (const pair of data.pairs) {
        const subscription = await tx.subscription.create({
          data: {
            userId: data.userId,
            pairId: pair.pairId,
            period: pair.period,
            startDate: new Date(data.startDate),
            expiryDate: new Date(pair.endDate),
            status: 'PENDING',
            inviteStatus: 'PENDING',
            basePrice: pair.basePrice ? parseFloat(pair.basePrice) : null,
            discountRate: pair.discountRate ? parseFloat(pair.discountRate) : null,
          },
        });
        subscriptionIds.push(subscription.id);
      }
    });

    return subscriptionIds;
  } catch (error) {
    console.error('Error creating subscriptions:', error);
    throw new Error('Failed to create subscriptions');
  }
}

/**
 * Validate if user exists
 * @param userId - User ID to validate
 * @returns Boolean indicating if user exists
 */
export async function validateUserExists(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    return !!user;
  } catch (error) {
    console.error('Error validating user:', error);
    return false;
  }
}

/**
 * Validate if pair exists
 * @param pairId - Pair ID to validate
 * @returns Boolean indicating if pair exists
 */
export async function validatePairExists(pairId: string): Promise<boolean> {
  try {
    const pair = await prisma.pair.findUnique({
      where: { id: pairId },
      select: { id: true },
    });
    return !!pair;
  } catch (error) {
    console.error('Error validating pair:', error);
    return false;
  }
}

/**
 * Get pair pricing information
 * @param pairId - Pair ID
 * @param period - Subscription period
 * @returns Pricing information for the pair and period
 */
export async function getPairPricing(
  pairId: string, 
  period: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS'
): Promise<{ basePrice: number; discount: number } | null> {
  try {
    const pair = await prisma.pair.findUnique({
      where: { id: pairId },
      select: {
        priceOneMonth: true,
        priceThreeMonths: true,
        priceSixMonths: true,
        priceTwelveMonths: true,
        discountOneMonth: true,
        discountThreeMonths: true,
        discountSixMonths: true,
        discountTwelveMonths: true,
      },
    });

    if (!pair) return null;

    const priceMap = {
      ONE_MONTH: { price: pair.priceOneMonth, discount: pair.discountOneMonth },
      THREE_MONTHS: { price: pair.priceThreeMonths, discount: pair.discountThreeMonths },
      SIX_MONTHS: { price: pair.priceSixMonths, discount: pair.discountSixMonths },
      TWELVE_MONTHS: { price: pair.priceTwelveMonths, discount: pair.discountTwelveMonths },
    };

    const { price, discount } = priceMap[period];

    return {
      basePrice: parseFloat(price.toString()),
      discount: parseFloat(discount.toString()),
    };
  } catch (error) {
    console.error('Error fetching pair pricing:', error);
    throw new Error('Failed to fetch pair pricing');
  }
}