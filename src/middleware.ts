import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(request) {
    // Middleware logic can be added here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Define public routes that don't require authentication
        const publicRoutes = [
          '/',
          '/signin',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/dashboard',
          '/subscriptions',
          '/billing',
          '/pair',
          '/portfolio',
          '/console', // Make /console public for now
        ];

        // Check if the current path is a public route
        const isPublicRoute = publicRoutes.some((route) => {
          if (route === '/') return pathname === '/';
          return pathname.startsWith(route);
        });

        // Allow access to public routes without authentication
        if (isPublicRoute) {
          return true;
        }

        // For all other routes, require authentication
        return !!token;

        // --- Example: Protect /console for admin/support only ---
        // Uncomment to restrict /console to admin/support roles only
        // if (pathname.startsWith('/console')) {
        //   return !!token && ['admin', 'support'].includes(token?.role);
        // }
      },
    },
    pages: {
      signIn: '/signin',
      error: '/signin',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
