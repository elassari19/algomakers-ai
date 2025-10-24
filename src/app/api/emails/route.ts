import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { z } from 'zod';

// Validation schema for email creation
const emailCreateSchema = z.object({
  to: z.string().email('Invalid email address'),
  from: z.string().email('Invalid from email address').optional(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  userId: z.string().optional(),
  metadata: z.any().optional(),
});

// Validation schema for email update
const emailUpdateSchema = z.object({
  to: z.string().email('Invalid email address').optional(),
  from: z.string().email('Invalid from email address').optional(),
  subject: z.string().min(1, 'Subject is required').optional(),
  body: z.string().min(1, 'Body is required').optional(),
  status: z.enum(['PENDING', 'SENT', 'FAILED', 'CANCELLED']).optional(),
  metadata: z.any().optional(),
});

// GET /api/emails - Fetch emails with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email'); // Search in 'to' field
    const subject = searchParams.get('subject');
    const status = searchParams.get('status');
    const sentAtPeriod = searchParams.get('sentAt'); // 'last_day', 'last_7_days', 'last_30_days', 'last_90_days'
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: any = {};

    // User ID filter
    if (userId) {
      where.userId = userId;
    }

    // Email filter (search in 'to' field)
    if (email && email.trim() !== '') {
      where.to = {
        contains: email.trim(),
        mode: 'insensitive',
      };
    }

    // Subject filter
    if (subject && subject.trim() !== '') {
      where.subject = {
        contains: subject.trim(),
        mode: 'insensitive',
      };
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    // SentAt period filter
    if (sentAtPeriod) {
      const now = new Date();
      let startDate: Date;

      switch (sentAtPeriod) {
        case 'last_day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'last_7_days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_30_days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last_90_days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
      }

      where.sentAt = {
        gte: startDate,
        lte: now,
      };
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Fetch emails
    const emails = await prisma.email.findMany({
      where,
      orderBy,
      take: limit,
      skip,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Get total count for pagination
    const totalCount = await prisma.email.count({ where });
    const hasMore = skip + limit < totalCount;

    return NextResponse.json({
      success: true,
      emails,
      totalCount,
      hasMore,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      message: 'Emails fetched successfully',
    });
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch emails',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/emails - Create a new email record
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input data
    const validatedData = emailCreateSchema.parse(body);

    // Create email record
    const email = await prisma.email.create({
      data: {
        to: validatedData.to,
        from: validatedData.from,
        subject: validatedData.subject,
        body: validatedData.body,
        userId: validatedData.userId,
        metadata: validatedData.metadata as any,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as any,
      action: AuditAction.EMAIL_CREATED,
      targetId: email.id,
      targetType: AuditTargetType.EMAIL,
      details: {
        to: email.to,
        subject: email.subject,
        userId: email.userId,
      },
    });

    return NextResponse.json({
      success: true,
      email,
      message: 'Email record created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating email:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Validation error',
          errors: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create email record',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}