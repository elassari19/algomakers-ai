import { NextResponse } from 'next/server';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Allow: /_next/static/
Allow: /_next/image
Allow: /api/og

# Disallow user-specific and sensitive pages
Disallow: /billing/
Disallow: /subscriptions/
Disallow: /profile/
Disallow: /auth/
Disallow: /unauthorized/

# Disallow all console/admin routes
Disallow: /console/
Disallow: /console/[id]/
Disallow: /console/affiliate/
Disallow: /console/analytics/
Disallow: /console/backtests/
Disallow: /console/billing/
Disallow: /console/emails/
Disallow: /console/events/
Disallow: /console/notifications/
Disallow: /console/subscriptions/
Disallow: /console/users/

# Disallow all API routes
Disallow: /api/
Disallow: /api/affiliates/
Disallow: /api/audit-logs/
Disallow: /api/auth/
Disallow: /api/backtest/
Disallow: /api/billing/
Disallow: /api/notifications/
Disallow: /api/payments/
Disallow: /api/stats/
Disallow: /api/subscriptions/
Disallow: /api/tradingview/
Disallow: /api/twelvedata/
Disallow: /api/users/

# Allow search engines to index public pages
Allow: /
Allow: /dashboard
Allow: /faq
Allow: /support
Allow: /legal
Allow: /affiliate

# Crawl delay to be respectful
Crawl-delay: 1

# Sitemap location
Sitemap: ${process.env.NEXTAUTH_URL || 'https://algomakers.ai'}/sitemap.xml`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}