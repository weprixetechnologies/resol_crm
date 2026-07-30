import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === '/login';

  // If no token and not on login page, redirect to login
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token exists and trying to access login, redirect to dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
