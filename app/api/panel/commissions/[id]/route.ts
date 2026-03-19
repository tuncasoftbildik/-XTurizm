import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH — acenta kendi kuralını günceller
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  // Sadece kendi tenant'ının kuralını güncelleyebilir
  const { data: rule } = await supabase
    .from('commission_rules')
    .select('tenant_id')
    .eq('id', id)
    .single()

  if (rule?.tenant_id !== profile?.tenant_id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('commission_rules')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — acenta kendi kuralını siler
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const { data: rule } = await supabase
    .from('commission_rules')
    .select('tenant_id')
    .eq('id', id)
    .single()

  if (rule?.tenant_id !== profile?.tenant_id) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 403 })
  }

  const { error } = await supabase.from('commission_rules').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
