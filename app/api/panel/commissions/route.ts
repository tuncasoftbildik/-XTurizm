import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET — acentanın kendi komisyon kuralları
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return NextResponse.json([])

  const { data: platformRules } = await supabase
    .from('commission_rules')
    .select('*')
    .is('tenant_id', null)
    .eq('is_active', true)

  const { data: agencyRules } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)

  return NextResponse.json({ platformRules: platformRules ?? [], agencyRules: agencyRules ?? [] })
}

// POST — acenta kendi komisyon kuralını ekler
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) return NextResponse.json({ error: 'Acenta bulunamadı' }, { status: 400 })

  const body = await request.json()

  const { data, error } = await supabase
    .from('commission_rules')
    .upsert({
      name: 'Acenta Komisyonu',
      tenant_id: profile.tenant_id,
      commission_type: body.commission_type ?? 'percentage',
      value: Number(body.value),
      min_amount: body.min_amount ? Number(body.min_amount) : null,
      max_amount: body.max_amount ? Number(body.max_amount) : null,
      is_active: true,
      priority: 10,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
