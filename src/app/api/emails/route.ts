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

// Validation schema for template creation
const templateCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
  type: z.enum(['MARKETING', 'TRANSACTIONAL', 'ANNOUNCEMENT']).default('MARKETING'),
  metadata: z.any().optional(),
});

// Validation schema for template update
const templateUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  subject: z.string().min(1, 'Subject is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  type: z.enum(['MARKETING', 'TRANSACTIONAL', 'ANNOUNCEMENT']).optional(),
  metadata: z.any().optional(),
});

// Validation schema for campaign creation
const campaignCreateSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  content: z.string().min(1, 'Content is required'),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  scheduledAt: z.string().optional(),
  metadata: z.any().optional(),
});

// Validation schema for campaign update
const campaignUpdateSchema = z.object({
  subject: z.string().min(1, 'Subject is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  recipients: z.array(z.string().email()).optional(),
  status: z.enum(['DRAFT', 'SENDING', 'SENT', 'FAILED']).optional(),
  scheduledAt: z.string().optional(),
  metadata: z.any().optional(),
});

// GET /api/emails - Fetch emails with filtering and pagination
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {

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
    const type = searchParams.get('type'); // 'emails', 'templates', 'campaigns'

    const skip = (page - 1) * limit;

    // Handle different types
    if (type === 'templates') {
      // Fetch templates
      const templates = await prisma.emailTemplate.findMany({
        where: userId ? { createdById: userId } : {},
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      const totalCount = await prisma.emailTemplate.count({
        where: userId ? { createdById: userId } : {},
      });

      return NextResponse.json({
        success: true,
        templates,
        totalCount,
        hasMore: skip + limit < totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        message: 'Templates fetched successfully',
      });
    } else if (type === 'campaigns') {
      // Fetch campaigns
      const campaigns = await prisma.emailCampaign.findMany({
        where: userId ? { userId } : {},
        orderBy: { [sortBy]: sortOrder },
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

      const totalCount = await prisma.emailCampaign.count({
        where: userId ? { userId } : {},
      });

      return NextResponse.json({
        success: true,
        campaigns,
        totalCount,
        hasMore: skip + limit < totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        message: 'Campaigns fetched successfully',
      });
    } else {
      // Default: fetch emails

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
    }
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

// POST /api/emails - Create a new email record, template, or campaign
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {

    const body = await request.json();

    // Check if it's a template creation
    if (body.name && body.subject && body.content && body.type) {
      const validatedData = templateCreateSchema.parse(body);

      const template = await prisma.emailTemplate.create({
        data: {
          name: validatedData.name,
          subject: validatedData.subject,
          content: validatedData.content,
          type: validatedData.type,
          metadata: validatedData.metadata as any,
          createdById: session.user.id,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      await createAuditLog({
        actorId: session.user.id,
        actorRole: session.user.role as any,
        action: AuditAction.EMAIL_CREATED,
        targetId: template.id,
        targetType: AuditTargetType.EMAIL,
        details: {
          name: template.name,
          type: template.type,
        },
      });

      return NextResponse.json({
        success: true,
        template,
        message: 'Template created successfully',
      }, { status: 201 });
    }

    // Check if it's a campaign creation
    if (body.subject && body.content && body.recipients) {
      const validatedData = campaignCreateSchema.parse(body);

      const campaign = await prisma.emailCampaign.create({
        data: {
          subject: validatedData.subject,
          content: validatedData.content,
          recipients: validatedData.recipients as any,
          recipientCount: validatedData.recipients.length,
          metadata: validatedData.metadata as any,
          userId: session.user.id,
          scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
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

      await createAuditLog({
        actorId: session.user.id,
        actorRole: session.user.role as any,
        action: AuditAction.EMAIL_CREATED,
        targetId: campaign.id,
        targetType: AuditTargetType.EMAIL,
        details: {
          subject: campaign.subject,
          recipientCount: campaign.recipientCount,
        },
      });

      return NextResponse.json({
        success: true,
        campaign,
        message: 'Campaign created successfully',
      }, { status: 201 });
    }

    // Default: create email record
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