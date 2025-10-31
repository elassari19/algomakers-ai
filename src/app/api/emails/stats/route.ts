import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const emailsSent = await prisma.email.count({
      where: { status: "SENT" },
    })
    const emailsFailed = await prisma.email.count({
      where: { status: "FAILED" },
    });
    const totalTemplates = await prisma.emailTemplate.count({});
    const totalCampaigns = await prisma.emailCampaign.count({});

    return NextResponse.json({
        emailsSent,
        emailsFailed,
        totalTemplates,
        totalCampaigns,
      });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}