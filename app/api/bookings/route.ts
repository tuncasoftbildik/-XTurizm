import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculatePrice } from '@/lib/commission/engine'
import { getProduct } from '@/lib/providers/mock'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Oturumu kontrol et
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum açmanız gerekiyor.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'Acenta bilgisi bulunamadı.' }, { status: 400 })
  }

  const body = await request.json()
  const { product_external_id, provider_id, customer_name, customer_email, customer_phone, notes } = body

  if (!product_external_id || !customer_name || !customer_email) {
    return NextResponse.json({ error: 'Ürün, müşteri adı ve email zorunludur.' }, { status: 400 })
  }

  // Ürünü mock provider'dan çek
  const product = await getProduct(product_external_id)
  if (!product) return NextResponse.json({ error: 'Ürün bulunamadı.' }, { status: 404 })

  // Platform komisyon kurallarını çek
  const { data: platformRules } = await supabase
    .from('commission_rules')
    .select('*')
    .is('tenant_id', null)
    .eq('is_active', true)

  // Acenta komisyon kurallarını çek
  const { data: agencyRules } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true)

  // Fiyat hesapla
  const pricing = calculatePrice({
    basePrice: product.basePrice,
    currency: product.currency,
    platformRules: platformRules ?? [],
    agencyRules: agencyRules ?? [],
    tenantId: profile.tenant_id,
    providerId: provider_id ?? 'mock',
    productType: product.type,
  })

  // Ürünü DB'de bul veya oluştur (products tablosu)
  let productId: string

  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('external_id', product_external_id)
    .single()

  if (existingProduct) {
    productId = existingProduct.id
  } else {
    // Yeni ürün kaydet
    const { data: newProduct, error: pErr } = await supabase
      .from('products')
      .insert({
        provider_id: provider_id ?? '00000000-0000-0000-0000-000000000000',
        external_id: product_external_id,
        type: product.type,
        title: product.title,
        description: product.description,
        base_price: product.basePrice,
        currency: product.currency,
        metadata: product.metadata,
        available_from: product.availableFrom ?? null,
        available_to: product.availableTo ?? null,
        is_active: true,
      })
      .select('id')
      .single()

    if (pErr || !newProduct) {
      return NextResponse.json({ error: 'Ürün kaydedilemedi.' }, { status: 500 })
    }
    productId = newProduct.id
  }

  // Rezervasyonu oluştur
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      product_id: productId,
      customer_name,
      customer_email,
      customer_phone: customer_phone || null,
      base_price: pricing.basePrice,
      platform_commission: pricing.platformCommission,
      agency_commission: pricing.agencyCommission,
      total_price: pricing.totalPrice,
      currency: pricing.currency,
      status: 'confirmed',
      notes: notes || null,
      metadata: {
        product_title: product.title,
        product_type: product.type,
        external_id: product_external_id,
      },
    })
    .select()
    .single()

  if (bErr || !booking) {
    return NextResponse.json({ error: 'Rezervasyon oluşturulamadı.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, booking_ref: booking.booking_ref, booking }, { status: 201 })
}
