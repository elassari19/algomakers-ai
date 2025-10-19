import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { NotificationBell } from './NotificationBell';
import { Basket } from './Basket';
import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { headers } from 'next/headers';

export async function AppHeader() {
  const session = await getServerSession(authOptions)

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '/';

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Add home
    breadcrumbs.push({
      label: 'Home',
      href: '/dashboard',
      isCurrentPage: pathname === '/dashboard',
    });

    // Add path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isCurrentPage = index === pathSegments.length - 1;

      // Format segment name
      const label = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        href: currentPath,
        isCurrentPage,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (!session?.user?.id) {
    return null; // or a loading state
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/20 bg-white/5 backdrop-blur-md">
      <div className="flex h-10 items-center justify-between pl-8 px-4 sm:px-6 sm:pl-12">
        {/* Left side - Breadcrumbs */}
        <div className="hidden md:flex items-center space-x-4">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href + index}>
                  <BreadcrumbItem>
                    {crumb.isCurrentPage ? (
                      <BreadcrumbPage className="text-white font-medium">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link
                          href={crumb.href}
                          className="text-white/70 hover:text-white transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbs.length - 1 && (
                    <BreadcrumbSeparator className="text-white/50" />
                  )}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Right side - Notifications and Basket */}
        <div className="flex items-center space-x-2">
          <NotificationBell userId={session.user.id} role={session.user.role} />
          <Basket />
        </div>
      </div>
    </header>
  );
}

