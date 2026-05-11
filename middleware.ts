import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: '/admin/:path*',
};

export function middleware(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return NextResponse.next();
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();

  const token = request.cookies.get('admin_auth')?.value;
  if (token === adminPassword) return NextResponse.next();

  return NextResponse.redirect(new URL('/admin/login', request.url));
}
