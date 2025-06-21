import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/api/auth/callback') {
    const error = request.nextUrl.searchParams.get('error');
    const code = request.nextUrl.searchParams.get('code');

    if (error && !code) {
      const adminUrl = new URL('/admin', request.url);
      adminUrl.searchParams.set('error', error);

      const errorDescription =
        request.nextUrl.searchParams.get('error_description');
      if (errorDescription) {
        adminUrl.searchParams.set('error_description', errorDescription);
      }

      return NextResponse.redirect(adminUrl);
    }
  }

  if (
    request.nextUrl.pathname === '/' &&
    (request.nextUrl.searchParams.has('code') ||
      request.nextUrl.searchParams.has('state'))
  ) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/auth/callback',
  ],
};
