import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/my-booking/[ref]
 * Body: { email: string }
 * Müşterinin kendi rezervasyonunu e-posta doğrulamasıyla görmesini sağlar.
 * Auth gerektirmez — public endpoint.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ref: string }> }
) {
  const { ref } = await params
  const body = await request.json().catch(() => ({}))
  const email = (body.email ?? '').trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'E-posta adresi zorunludur.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, tenants(name, contact_email, contact_phone, logo_url, primary_color, slug)')
    .eq('booking_ref', ref)
    .single()

  if (error || !booking) {
    return NextResponse.json({ error: 'Rezervasyon bulunamadı.' }, { status: 404 })
  }

  // E-posta eşleşmiyorsa bilgi verme (güvenlik)
  if (booking.customer_email.toLowerCase() !== email) {
    return NextResponse.json({ error: 'E-posta adresi eşleşmiyor.' }, { status: 403 })
  }

  return NextResponse.json(booking)
}
