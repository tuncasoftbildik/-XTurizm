import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

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

  const body = await request.json()
  const { status } = body

  const allowed = ['pending', 'confirmed', 'cancelled', 'completed']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Geçersiz durum' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
