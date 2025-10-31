import { NextRequest } from 'next/server';
import { AuditAction, AuditTargetType, createAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const target = url.searchParams.get('url') || undefined;
  const email = url.searchParams.get('email') || undefined;
  const msgid = url.searchParams.get('msgid') || undefined;
  const campaign = url.searchParams.get('campaign') || undefined;

  const userAgent = request.headers.get('user-agent') || undefined;
  const xff = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
  
  if (!target) {
    return new Response('Missing target url', { status: 400 });
  }
  try {

    const parsed = new URL(target);
    if (!/^https?:$/.test(parsed.protocol)) {
      return new Response('Invalid target URL', { status: 400 });
    }

    // Record click event
      if (campaign) {
        const ec = await prisma.emailCampaign.findUnique({ where: { id: campaign } });
        if (ec) {
          // attempt to resolve user by email
          let userId: string | undefined = undefined;
          if (email) {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) userId = user.id;
          }

          if (userId) {
            const already = (ec.clickedIds || []).includes(userId);
            if (!already) {
              await prisma.emailCampaign.update({ where: { id: campaign }, data: { clickedIds: { push: userId } } });
            }
          }

          // Increment clickedCount in the EmailCampaign metadata
          try {
            const md = (ec.metadata as any) || {};
            const newMd = { ...md, clickedCount: (md.clickedCount || 0) + 1 };
            await prisma.emailCampaign.update({ where: { id: campaign }, data: { metadata: newMd } });
          } catch (err) {
            console.error('Failed to increment clickedCount on campaign metadata:', err);
          }
        }
      }

      await createAuditLog({
        actorId: email || 'anonymous',
        actorRole: 'USER',
        action: AuditAction.EMAIL_UPDATED,
        targetId: msgid || campaign || 'unknown',
        targetType: AuditTargetType.EMAIL,
        responseStatus: "SUCCESS",
        details: {
          email,
          msgid,
          campaign,
          target,
          userAgent,
          ip: xff,
        },
      });

    // Redirect to target
    return Response.redirect(target, 307);
  } catch (error) {
    console.error('Failed to create audit log for email click:', error);
    await createAuditLog({
      actorId: email || 'anonymous',
      actorRole: 'USER',
      action: AuditAction.EMAIL_UPDATED,
      targetId: msgid || campaign || 'unknown',
      targetType: AuditTargetType.EMAIL,
      responseStatus: "FAILURE",
      details: {
        email,
        msgid,
        campaign,
        target,
        userAgent,
        ip: xff,
      },
    });

    return new Response(null, { status: 500 });
  }
}
