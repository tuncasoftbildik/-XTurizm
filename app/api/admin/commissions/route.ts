import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET — tüm komisyon kurallarını listele
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('commission_rules')
    .select(`
      *,
      tenants(id, name, slug),
      providers(id, name, type)
    `)
    .order('tenant_id', { ascending: true, nullsFirst: true })
    .order('priority', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — yeni kural oluştur
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const body = await request.json()

  const { name, tenant_id, provider_id, product_type, commission_type, value, min_amount, max_amount, priority } = body

  if (!name || !commission_type || value === undefined) {
    return NextResponse.json({ error: 'Ad, tür ve değer zorunludur.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('commission_rules')
    .insert({
      name,
      tenant_id: tenant_id || null,
      provider_id: provider_id || null,
      product_type: product_type || null,
      commission_type,
      value: Number(value),
      min_amount: min_amount ? Number(min_amount) : null,
      max_amount: max_amount ? Number(max_amount) : null,
      priority: Number(priority) || 0,
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
