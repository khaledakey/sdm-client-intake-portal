import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Not imported from '@/lib/auth' on purpose: that module pulls in the
// Prisma client, which cannot run in the Edge middleware runtime.
const SESSION_COOKIE = 'sdm_session';

const PROTECTED_CLIENT_PATHS = ['/dashboard', '/business', '/intake', '/documents', '/support', '/notifications', '/account'];
const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

async function readSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = process.env.AUTH_SECRET;
    if (!secret) return null;
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return { sub: payload.sub as string, role: payload.role as string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  const isAdminPath = pathname.startsWith('/admin');
  const isClientPath = PROTECTED_CLIENT_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if ((isAdminPath || isClientPath) && !session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminPath && session && session.role === 'CLIENT') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (isAuthPath && session) {
    const url = req.nextUrl.clone();
    url.pathname = session.role === 'CLIENT' ? '/dashboard' : '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/business/:path*',
    '/intake/:path*',
    '/documents/:path*',
    '/support/:path*',
    '/notifications/:path*',
    '/account/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
  ],
};
