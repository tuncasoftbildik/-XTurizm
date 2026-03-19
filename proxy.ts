import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { resolveTenantSlug, buildTenantContext } from '@/lib/tenant/resolve'

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const pathname = request.nextUrl.pathname
  const slug = resolveTenantSlug(hostname)
  const ctx = buildTenantContext(slug)

  // Response'u başlat (cookie güncellemesi için gerekli)
  let response = NextResponse.next()

  // Tenant bilgisini header'a ekle
  const headers = new Headers(request.headers)
  headers.set('x-tenant-slug', slug ?? '')
  headers.set('x-is-admin', String(ctx.isAdmin))
  headers.set('x-is-agency', String(ctx.isAgency))
  headers.set('x-hostname', hostname)

  // Supabase session yenileme
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // --- Route Protection ---
  // /display/* herkese açık — auth gerekmez
  if (pathname.startsWith('/display/')) {
    return NextResponse.next({ request: { headers } })
  }

  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')
  const isPanelRoute = pathname.startsWith('/panel') && !pathname.startsWith('/panel/login')

  if (isAdminRoute && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  if (isPanelRoute && !user) {
    return NextResponse.redirect(new URL('/panel/login', request.url))
  }

  // --- Production: subdomain routing ---
  if (!hostname.startsWith('localhost')) {
    if (ctx.isAdmin && !pathname.startsWith('/admin')) {
      return NextResponse.rewrite(new URL(`/admin${pathname}`, request.url))
    } else if (ctx.isAgency && slug && !pathname.startsWith('/panel')) {
      return NextResponse.rewrite(new URL(`/panel${pathname}`, request.url))
    }
  }

  response = NextResponse.next({ request: { headers } })
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
