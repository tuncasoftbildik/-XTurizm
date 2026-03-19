import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'platform_admin') return null
  return user
}

// GET — tüm acentaları listele
export async function GET() {
  const supabase = await createClient()

  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })

  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      users(count)
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — yeni acenta oluştur
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })

  const body = await request.json()

  const { name, slug, contact_email, contact_phone, primary_color, secondary_color } = body

  if (!name || !slug || !contact_email) {
    return NextResponse.json({ error: 'Ad, slug ve email zorunludur.' }, { status: 400 })
  }

  // Slug format kontrolü
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug sadece küçük harf, rakam ve tire içerebilir.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      contact_email,
      contact_phone: contact_phone || null,
      primary_color: primary_color || '#1e40af',
      secondary_color: secondary_color || '#3b82f6',
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Bu slug zaten kullanılıyor.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
