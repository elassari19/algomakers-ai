import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog, AuditAction, AuditTargetType } from '@/lib/audit';
import { z } from 'zod';

// Validation schema for email update
const emailUpdateSchema = z.object({
  to: z.string().email('Invalid email address').optional(),
  from: z.string().email('Invalid from email address').optional(),
  subject: z.string().min(1, 'Subject is required').optional(),
  body: z.string().min(1, 'Body is required').optional(),
  status: z.enum(['PENDING', 'SENT', 'FAILED', 'CANCELLED']).optional(),
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

// Validation schema for campaign update
const campaignUpdateSchema = z.object({
  subject: z.string().min(1, 'Subject is required').optional(),
  content: z.string().min(1, 'Content is required').optional(),
  recipients: z.array(z.string().email()).optional(),
  status: z.enum(['DRAFT', 'SENDING', 'SENT', 'FAILED']).optional(),
  scheduledAt: z.string().optional(),
  metadata: z.any().optional(),
});

// GET /api/emails/[id] - Fetch a specific email, template, or campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'emails', 'templates', 'campaigns'

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID is required',
        },
        { status: 400 }
      );
    }

    if (type === 'templates') {
      const template = await prisma.emailTemplate.findUnique({
        where: { id },
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

      if (!template) {
        return NextResponse.json(
          {
            success: false,
            message: 'Template not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        template,
        message: 'Template fetched successfully',
      });
    } else if (type === 'campaigns') {
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id },
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

      if (!campaign) {
        return NextResponse.json(
          {
            success: false,
            message: 'Campaign not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        campaign,
        message: 'Campaign fetched successfully',
      });
    } else {
      // Default: fetch email
      const email = await prisma.email.findUnique({
        where: { id },
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

      if (!email) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        email,
        message: 'Email fetched successfully',
      });
    }
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch item',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PUT /api/emails/[id] - Update a specific email, template, or campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'emails', 'templates', 'campaigns'

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'ID is required',
        },
        { status: 400 }
      );
    }

    if (type === 'templates') {
      const existingTemplate = await prisma.emailTemplate.findUnique({
        where: { id },
      });

      if (!existingTemplate) {
        return NextResponse.json(
          {
            success: false,
            message: 'Template not found',
          },
          { status: 404 }
        );
      }

      const validatedData = templateUpdateSchema.parse(body);

      const updatedTemplate = await prisma.emailTemplate.update({
        where: { id },
        data: validatedData as any,
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
        action: AuditAction.EMAIL_UPDATED,
        targetId: updatedTemplate.id,
        targetType: AuditTargetType.EMAIL,
        details: {
          name: updatedTemplate.name,
          type: updatedTemplate.type,
        },
      });

      return NextResponse.json({
        success: true,
        template: updatedTemplate,
        message: 'Template updated successfully',
      });
    } else if (type === 'campaigns') {
      const existingCampaign = await prisma.emailCampaign.findUnique({
        where: { id },
      });

      if (!existingCampaign) {
        return NextResponse.json(
          {
            success: false,
            message: 'Campaign not found',
          },
          { status: 404 }
        );
      }

      const validatedData = campaignUpdateSchema.parse(body);

      const updatedCampaign = await prisma.emailCampaign.update({
        where: { id },
        data: {
          ...validatedData,
          recipientCount: validatedData.recipients ? validatedData.recipients.length : existingCampaign.recipientCount,
          scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : existingCampaign.scheduledAt,
        } as any,
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
        action: AuditAction.EMAIL_UPDATED,
        targetId: updatedCampaign.id,
        targetType: AuditTargetType.EMAIL,
        details: {
          subject: updatedCampaign.subject,
          status: updatedCampaign.status,
        },
      });

      return NextResponse.json({
        success: true,
        campaign: updatedCampaign,
        message: 'Campaign updated successfully',
      });
    } else {
      // Default: update email
      const existingEmail = await prisma.email.findUnique({
        where: { id },
      });

      if (!existingEmail) {
        return NextResponse.json(
          {
            success: false,
            message: 'Email not found',
          },
          { status: 404 }
        );
      }

      const validatedData = emailUpdateSchema.parse(body);

      const updatedEmail = await prisma.email.update({
        where: { id },
        data: validatedData as any,
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
        action: AuditAction.EMAIL_UPDATED,
        targetId: updatedEmail.id,
        targetType: AuditTargetType.EMAIL,
        details: {
          to: updatedEmail.to,
          subject: updatedEmail.subject,
        },
      });

      return NextResponse.json({
        success: true,
        email: updatedEmail,
        message: 'Email updated successfully',
      });
    }
  } catch (error) {
    console.error('Error updating item:', error);

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
        message: 'Failed to update item',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/emails/[id] - Delete a specific email
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email ID is required',
        },
        { status: 400 }
      );
    }

    // Check if email exists
    const existingEmail = await prisma.email.findUnique({
      where: { id },
      select: {
        id: true,
        to: true,
        subject: true,
        userId: true,
      },
    });

    if (!existingEmail) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email not found',
        },
        { status: 404 }
      );
    }

    // Delete email
    await prisma.email.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      actorId: session.user.id,
      actorRole: session.user.role as any,
      action: AuditAction.EMAIL_DELETED,
      targetId: id,
      targetType: AuditTargetType.EMAIL,
      details: {
        to: existingEmail.to,
        subject: existingEmail.subject,
        userId: existingEmail.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting email:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete email',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}