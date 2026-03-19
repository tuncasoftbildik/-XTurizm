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

// POST — acenta yeni komisyon kuralı ekler (ürün tipine göre)
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
  const { name, product_type, commission_type, value, min_amount, max_amount } = body

  if (!commission_type || value === undefined || value === '') {
    return NextResponse.json({ error: 'Tür ve değer zorunludur.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('commission_rules')
    .insert({
      name: name || (product_type ? `Acenta Komisyonu — ${product_type}` : 'Acenta Genel Komisyonu'),
      tenant_id: profile.tenant_id,
      product_type: product_type || null,
      commission_type,
      value: Number(value),
      min_amount: min_amount ? Number(min_amount) : null,
      max_amount: max_amount ? Number(max_amount) : null,
      is_active: true,
      priority: 10,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
