import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PASSWORD = 'marley2026'
const AUTH_COOKIE_NAME = 'cmo-auth'
const AUTH_COOKIE_VALUE = 'true'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body as { password?: string }

    if (password !== PASSWORD) {
      return NextResponse.json({ ok: false, error: 'Invalid password' }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })

    const maxAge = 30 * 24 * 60 * 60 // 30 days in seconds

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: AUTH_COOKIE_VALUE,
      maxAge,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 })
  }
}

