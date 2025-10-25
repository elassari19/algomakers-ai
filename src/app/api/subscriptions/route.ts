import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import type { Role } from '@/generated/prisma';
import { sendEmail } from '@/lib/email-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // Single subscription by ID
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // If fetching single subscription by ID
    if (id) {
      const subscription = await prisma.subscription.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              tradingviewUsername: true,
            }
          },
          pair: {
            select: {
              id: true,
              symbol: true,
              timeframe: true,
              version: true,
            }
          },
          payment: {
            include: {
              paymentItems: {
                include: {
                  pair: {
                    select: {
                      symbol: true,
                      timeframe: true,
                    }
                  }
                }
              }
            }
          },
          commissions: {
            include: {
              affiliate: {
                select: {
                  referralCode: true,
                  commissionRate: true,
                }
              }
            }
          }
        }
      });

      if (!subscription) {
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        subscriptions: [subscription],
        totalCount: 1,
      });
    }

    // Build where clause
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status.toUpperCase();
    }
    if (search) {
      where.OR = [
        {
          user: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          user: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          pair: {
            symbol: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          pair: {
            timeframe: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          pair: {
            version: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          status: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Fetch subscriptions with related data
    const subscriptions = await prisma.subscription.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            tradingviewUsername: true,
          }
        },
        pair: {
          select: {
            id: true,
            symbol: true,
            timeframe: true,
            version: true,
          }
        },
        payment: {
          include: {
            paymentItems: {
              include: {
                pair: {
                  select: {
                    symbol: true,
                    timeframe: true,
                  }
                }
              }
            }
          }
        },
        commissions: {
          include: {
            affiliate: {
              select: {
                referralCode: true,
                commissionRate: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.subscription.count({ where });

    // Calculate some basic stats
    const stats = await prisma.subscription.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      where: userId ? { userId } : undefined,
    });

    const totalRevenue = await prisma.payment.aggregate({
      _sum: {
        actuallyPaid: true,
      },
      where: {
        userId: userId || undefined,
      },
    });

    return NextResponse.json({
      subscriptions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        byStatus: stats,
        totalRevenue: totalRevenue?._sum?.actuallyPaid ?? 0,
      },
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    await createAuditLog({
      actorId: 'unknown',
      actorRole: 'USER',
      action: AuditAction.CREATE_SUBSCRIPTION,
      targetType: AuditTargetType.SUBSCRIPTION,
      responseStatus: 'FAILURE',
      details: { reason: 'unauthorized' },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    
    // Check if it's the new multi-pair format or legacy single pair format
    const isMultiPair = body.pairs && Array.isArray(body.pairs);
    
    if (isMultiPair) {
      // Handle multiple pairs subscription creation
      const { userId, startDate, pairs } = body;

      // Validate required fields
      if (!userId || !startDate || !pairs || pairs.length === 0) {
        return NextResponse.json(
          { error: 'Missing required fields: userId, startDate, and pairs array' },
          { status: 400 }
        );
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Validate all pairs exist
      const pairIds = pairs.map((p: any) => p.pairId);
      const existingPairs = await prisma.pair.findMany({
        where: { id: { in: pairIds } }
      });

      if (existingPairs.length !== pairIds.length) {
        return NextResponse.json(
          { error: 'One or more trading pairs not found' },
          { status: 404 }
        );
      }

      // Check for existing active subscriptions
      const existingSubscriptions = await prisma.subscription.findMany({
        where: {
          userId,
          pairId: { in: pairIds },
          status: 'ACTIVE',
        },
        include: {
          pair: { select: { symbol: true } }
        }
      });

      if (existingSubscriptions.length > 0) {
        const conflictingSymbols = existingSubscriptions.map(s => s.pair.symbol).join(', ');
        return NextResponse.json(
          { error: `User already has active subscriptions for: ${conflictingSymbols}` },
          { status: 409 }
        );
      }

      // Create subscriptions in a transaction
      const subscriptions = await prisma.$transaction(async (tx) => {
        const createdSubscriptions = [];
        
        for (const pair of pairs) {
          const subscription = await tx.subscription.create({
            data: {
              userId,
              pairId: pair.pairId,
              period: pair.period.toUpperCase(),
              startDate: new Date(startDate),
              expiryDate: new Date(pair.endDate),
              status: 'PENDING',
              inviteStatus: 'PENDING',
              basePrice: pair.basePrice ? parseFloat(pair.basePrice) : null,
              discountRate: pair.discountRate ? parseFloat(pair.discountRate) : null,
            },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  tradingviewUsername: true,
                }
              },
              pair: {
                select: {
                  id: true,
                  symbol: true,
                  timeframe: true,
                  version: true,
                }
              }
            }
          });
          createdSubscriptions.push(subscription);
        }
        
        return createdSubscriptions;
      });



      // Audit log for all roles
      if (session?.user?.id) {
        await createAuditLog({
          actorId: session.user.id,
          actorRole: session.user.role as Role,
          action: AuditAction.CREATE_SUBSCRIPTION,
          targetType: AuditTargetType.SUBSCRIPTION,
          targetId: subscriptions[0].id,
          responseStatus: 'SUCCESS',
          details: {
            subscriptionCount: subscriptions.length,
            targetUser: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
            pairs: subscriptions.map(s => ({
              symbol: s.pair.symbol,
              timeframe: s.pair.timeframe,
              period: s.period,
            })),
            actorEmail: session.user.email,
            actorName: session.user.name,
          },
        });
      }

      return NextResponse.json({
        message: `${subscriptions.length} subscriptions created successfully`,
        subscriptions,
      });
      
    } else {
      // Handle legacy single pair format
      const {
        userId,
        pairId,
        period,
        startDate,
        expiryDate,
        basePrice,
        discountRate,
      } = body;

      // Validate required fields
      if (!userId || !pairId || !period || !startDate || !expiryDate) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Check if user and pair exist
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const pair = await prisma.pair.findUnique({
        where: { id: pairId }
      });

      if (!pair) {
        return NextResponse.json(
          { error: 'Trading pair not found' },
          { status: 404 }
        );
      }

      // Check for existing active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          pairId,
          status: 'ACTIVE',
        }
      });

      if (existingSubscription) {
        return NextResponse.json(
          { error: 'User already has an active subscription for this pair' },
          { status: 409 }
        );
      }

      // Create the subscription
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          pairId,
          period: period.toUpperCase(),
          startDate: new Date(startDate),
          expiryDate: new Date(expiryDate),
          status: 'PENDING',
          inviteStatus: 'PENDING',
          basePrice: basePrice ? parseFloat(basePrice) : null,
          discountRate: discountRate ? parseFloat(discountRate) : null,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              tradingviewUsername: true,
            }
          },
          pair: {
            select: {
              id: true,
              symbol: true,
              timeframe: true,
              version: true,
            }
          }
        }
      });



      // Audit log for all roles
      if (session?.user?.id) {
        await createAuditLog({
          actorId: session.user.id,
          actorRole: session.user.role as Role,
          action: AuditAction.CREATE_SUBSCRIPTION,
          targetType: AuditTargetType.SUBSCRIPTION,
          targetId: subscription.id,
          responseStatus: 'SUCCESS',
          details: {
            targetUser: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
            pair: {
              symbol: pair.symbol,
              timeframe: pair.timeframe,
              version: pair.version,
            },
            period: subscription.period,
            basePrice: subscription.basePrice,
            discountRate: subscription.discountRate,
            actorEmail: session.user.email,
            actorName: session.user.name,
          },
        });
      }

      return NextResponse.json({
        message: 'Subscription created successfully',
        subscription,
      });
    }

  } catch (error) {
    console.error('Error creating subscription:', error);
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role,
      action: AuditAction.CREATE_SUBSCRIPTION,
      targetType: AuditTargetType.SUBSCRIPTION,
      responseStatus: 'FAILURE',
      details: { reason: 'exception', error: (error as Error).message },
    });
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Check if subscription exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        pair: {
          select: {
            id: true,
            symbol: true,
            timeframe: true,
            version: true,
          }
        }
      }
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const dataToUpdate: any = {};
    
    if (updateData.status) {
      dataToUpdate.status = updateData.status.toUpperCase();
    }
    
    // accept either inviteStatus or inviteState in request body
    const incomingInvite = updateData.inviteStatus ?? updateData.inviteState;
    if (incomingInvite) {
      dataToUpdate.inviteStatus = String(incomingInvite).toUpperCase();
    }

    // If invite is completed, set startDate to now and compute expiryDate from period
    if (incomingInvite && String(incomingInvite).toUpperCase() === 'COMPLETED') {
      const now = new Date();
      dataToUpdate.startDate = now;

      // Determine period to calculate expiry: prefer updateData.period, fallback to existing subscription
      const periodValue = (updateData.period ? String(updateData.period).toUpperCase() : existingSubscription.period ? String(existingSubscription.period).toUpperCase() : null);
      let monthsToAdd = 0;
      switch (periodValue) {
        case 'ONE_MONTH':
          monthsToAdd = 1;
          break;
        case 'THREE_MONTHS':
          monthsToAdd = 3;
          break;
        case 'SIX_MONTHS':
          monthsToAdd = 6;
          break;
        case 'TWELVE_MONTHS':
          monthsToAdd = 12;
          break;
        default:
          monthsToAdd = 0;
      }

      if (monthsToAdd > 0) {
        const expiry = new Date(now);
        expiry.setMonth(expiry.getMonth() + monthsToAdd);
        dataToUpdate.expiryDate = expiry;
      }
    }
    
    // Only apply explicit start/expiry from payload when invite was NOT completed.
    // If invite completed we already computed startDate/expiryDate above and should not override them.
    if (!(incomingInvite && String(incomingInvite).toUpperCase() === 'COMPLETED')) {
      if (updateData.startDate) {
        dataToUpdate.startDate = new Date(updateData.startDate);
      }

      if (updateData.expiryDate) {
        dataToUpdate.expiryDate = new Date(updateData.expiryDate);
      }
    }
    
    if (updateData.basePrice !== undefined) {
      dataToUpdate.basePrice = parseFloat(updateData.basePrice);
    }
    
    if (updateData.discountRate !== undefined) {
      dataToUpdate.discountRate = parseFloat(updateData.discountRate);
    }

    // Update the subscription
    const subscription = await prisma.subscription.update({
      where: { id },
      data: dataToUpdate,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            tradingviewUsername: true,
          }
        },
        pair: {
          select: {
            id: true,
            symbol: true,
            timeframe: true,
            version: true,
          }
        },
        payment: true,
      }
    });



    // Audit log for all roles
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role,
      action: AuditAction.UPDATE_SUBSCRIPTION,
      targetType: AuditTargetType.SUBSCRIPTION,
      targetId: subscription.id,
      responseStatus: 'SUCCESS',
      details: {
        updatedFields: Object.keys(dataToUpdate),
        targetUser: {
          id: existingSubscription.user.id,
          email: existingSubscription.user.email,
          name: existingSubscription.user.name,
        },
        pair: {
          symbol: existingSubscription.pair.symbol,
          timeframe: existingSubscription.pair.timeframe,
        },
        previousValues: {
          status: existingSubscription.status,
          inviteStatus: existingSubscription.inviteStatus,
        },
        newValues: dataToUpdate,
        actorEmail: session.user.email,
        actorName: session.user.name,
      },
    });

    const inviteStatusUpper = (incomingInvite: string): any => {
      let template;
      switch (incomingInvite) {
        case 'COMPLETED':
          template = 'invite_completed';
          break;
        case 'SENT':
          template = 'invite_sent';
          break;
        case 'PENDING':
          template = 'invite_pending';
          break;
        case 'CANCELED':
          template = 'invite_canceled';
          break;
        default:
          template = 'invite_pending';
          break;
      }
      return template;
    };

    await sendEmail({
      to: subscription.user.email,
      subject: 'Your Subscription Has Been Updated',
      template: inviteStatusUpper(subscription.inviteStatus),
      params: {
        userId: subscription.user.id,
        email: subscription.user.email,
        name: subscription.user.name,
        tradingViewUsername: subscription.user.tradingviewUsername,
        pairSymbol: subscription.pair.symbol,
        pairTimeframe: subscription.pair.timeframe,
        newStatus: subscription.status,
        newInviteStatus: subscription.inviteStatus,
        period: subscription.period,
        startDate: subscription.startDate.toDateString(),
        expiryDate: subscription.expiryDate.toDateString(),
      },
    });

    return NextResponse.json({
      message: 'Subscription updated successfully',
      subscription,
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    await createAuditLog({
      actorId: session?.user?.id || 'unknown',
      actorRole: session?.user?.role as Role || 'USER',
      action: AuditAction.UPDATE_SUBSCRIPTION,
      targetType: AuditTargetType.SUBSCRIPTION,
      responseStatus: 'FAILURE',
      details: { reason: 'exception', error: (error as Error).message },
    });

    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  try {

    if (!session?.user?.id) {
      await createAuditLog({
        actorId: 'unknown',
        actorRole: 'USER',
        action: AuditAction.CANCEL_SUBSCRIPTION,
        targetType: AuditTargetType.SUBSCRIPTION,
        responseStatus: 'FAILURE',
        details: { reason: 'unauthorized' },
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Check if subscription exists and get details for audit log
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        },
        pair: {
          select: {
            id: true,
            symbol: true,
            timeframe: true,
            version: true,
          }
        }
      }
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Delete the subscription (this will also cascade delete related records)
    await prisma.subscription.delete({
      where: { id }
    });



    // Audit log for all roles
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as Role,
      action: AuditAction.CANCEL_SUBSCRIPTION,
      targetType: AuditTargetType.SUBSCRIPTION,
      targetId: id,
      responseStatus: 'SUCCESS',
      details: {
        deletedSubscription: {
          targetUser: {
            id: existingSubscription.user.id,
            email: existingSubscription.user.email,
            name: existingSubscription.user.name,
          },
          pair: {
            symbol: existingSubscription.pair.symbol,
            timeframe: existingSubscription.pair.timeframe,
            version: existingSubscription.pair.version,
          },
          period: existingSubscription.period,
          status: existingSubscription.status,
          inviteStatus: existingSubscription.inviteStatus,
        },
        actorEmail: session.user.email,
        actorName: session.user.name,
      },
    });

    return NextResponse.json({
      message: 'Subscription deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting subscription:', error);
    await createAuditLog({
      actorId: session?.user?.id || 'unknown',
      actorRole: session?.user?.role as Role || 'USER',
      action: AuditAction.CANCEL_SUBSCRIPTION,
      targetType: AuditTargetType.SUBSCRIPTION,
      responseStatus: 'FAILURE',
      details: { reason: 'exception', error: (error as Error).message },
    });

    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}