import { NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not configured')
}

const encodedSecret = new TextEncoder().encode(jwtSecret)

async function verifyAdminToken(token) {
  return jwtVerify(token, encodedSecret)
}

export async function proxy(request) {
  const { pathname } = request.nextUrl

  if (pathname === '/admin/login' || pathname.startsWith('/admin/login/')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('admin_token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  try {
    await verifyAdminToken(token)

    const response = NextResponse.next()
    response.headers.set('x-admin-authenticated', 'true')

    return response
  } catch (error) {
    console.error('Admin token verification failed:', error.message)
    const response = NextResponse.redirect(new URL('/admin/login', request.url))
    response.cookies.delete('admin_token')
    return response
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
