import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/resend'
import { agencyStatusEmail } from '@/lib/email/templates'

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

// PATCH — güncelle (ad, renkler, durum)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })

  const { id } = await params
  const body = await request.json()

  // Durum değişikliğini takip et
  let previousStatus: string | null = null
  if (body.status) {
    const { data: current } = await supabase
      .from('tenants')
      .select('status, name, contact_email')
      .eq('id', id)
      .single()
    previousStatus = current?.status ?? null
  }

  const { data, error } = await supabase
    .from('tenants')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Durum değiştiyse email gönder
  if (body.status && body.status !== previousStatus && data) {
    const statusForEmail = body.status as 'active' | 'suspended'
    if (statusForEmail === 'active' || statusForEmail === 'suspended') {
      try {
        const emailData = agencyStatusEmail({
          agencyName: data.name,
          status: statusForEmail,
          contactEmail: data.contact_email,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://xturizm.com'}/panel/login`,
        })
        await sendEmail({ to: data.contact_email, ...emailData })
      } catch {
        console.error('[Agency] Durum değişikliği emaili gönderilemedi.')
      }
    }
  }

  return NextResponse.json(data)
}

// DELETE — acentayı sil
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 403 })

  const { id } = await params

  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
