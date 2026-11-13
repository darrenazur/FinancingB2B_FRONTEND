import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// A quick gate only: it checks that a session cookie exists. The API decides whether that session is still valid.
export function proxy(request: NextRequest) {
  if (request.cookies.has('bms_session')) return NextResponse.next()
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  // The manifest and icons hold no borrower data, and a phone fetches them before anyone signs in
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon).*)'],
}
