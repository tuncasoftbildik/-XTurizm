import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single<{ role: string }>()

  if (profile?.role !== 'platform_admin') {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id, created_at, status,
      base_price, platform_commission, agency_commission, total_price, currency,
      metadata,
      tenants ( id, name, slug )
    `)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(bookings ?? [])
}
