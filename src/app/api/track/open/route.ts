import { NextRequest } from 'next/server';
import { AuditAction, AuditTargetType, createAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

// 1x1 transparent GIF (base64)
const TRANSPARENT_GIF_BASE64 = 'R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email') || undefined;
  const msgid = url.searchParams.get('msgid') || undefined;
  const campaign = url.searchParams.get('campaign') || undefined;

  const userAgent = request.headers.get('user-agent') || undefined;
  const xff = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;

  // Record an audit log for the open event. This avoids needing a DB migration for a new table.
  try {
    if (campaign) {
      const ec = await prisma.emailCampaign.findUnique({ where: { id: campaign } });
      if (ec) {
        // attempt to resolve user by email
        let userId: string | undefined = undefined;
        if (email) {
          const user = await prisma.user.findUnique({ where: { email } });
          if (user) userId = user.id;
        }

        // push userId into openedIds if we have it and it's not already present
        if (userId) {
          const already = (ec.openedIds || []).includes(userId);
          if (!already) {
            await prisma.emailCampaign.update({ where: { id: campaign }, data: { openedIds: { push: userId } } });
          }
        }

        // Increment openedCount in the EmailCampaign metadata
        try {
          const md = (ec.metadata as any) || {};
          const newMd = { ...md, openedCount: (md.openedCount || 0) + 1 };
          await prisma.emailCampaign.update({ where: { id: campaign }, data: { metadata: newMd } });
        } catch (err) {
          console.error('Failed to increment openedCount on campaign metadata:', err);
        }
      }
    }

    await createAuditLog({
      actorId: email || 'anonymous',
      actorRole: 'USER',
      action: AuditAction.EMAIL_UPDATED,
      targetId: msgid || campaign || 'unknown',
      targetType: AuditTargetType.EMAIL,
      details: {
        email,
        msgid,
        campaign,
        userAgent,
        ip: xff,
      },
    });

    return new Response("email opened",{ status: 200 });
  } catch (error) {
    console.error('Error in /api/track/open:', error);
    return new Response(null, { status: 500 });
  }
}
