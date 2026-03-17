import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const AUTH_COOKIE_NAME = 'cmo-auth'
const AUTH_COOKIE_VALUE = 'true'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login routes through without auth to avoid redirect loops
  if (pathname.startsWith('/login') || pathname.startsWith('/api/login')) {
    return NextResponse.next()
  }

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)

  if (authCookie?.value === AUTH_COOKIE_VALUE) {
    return NextResponse.next()
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.search = ''

  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

