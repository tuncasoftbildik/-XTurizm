/**
 * B2C Public Booking API — Auth gerektirmez
 * Doğrudan web sitesinden yapılan rezervasyonlar için.
 * Sadece platform komisyonu uygulanır (acenta komisyonu yok).
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculatePrice, formatCurrency } from '@/lib/commission/engine'
import { getProduct } from '@/lib/providers/mock'
import { sendEmail } from '@/lib/email/resend'
import { bookingConfirmationEmail } from '@/lib/email/templates'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const body = await request.json()
  const { product_external_id, customer_name, customer_email, customer_phone, notes } = body

  if (!product_external_id || !customer_name || !customer_email) {
    return NextResponse.json({ error: 'Ürün, müşteri adı ve email zorunludur.' }, { status: 400 })
  }

  // Email formatı kontrolü
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
    return NextResponse.json({ error: 'Geçersiz email adresi.' }, { status: 400 })
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

  // B2C satışta acenta komisyonu yok
  const pricing = calculatePrice({
    basePrice: product.basePrice,
    currency: product.currency,
    platformRules: platformRules ?? [],
    agencyRules: [],
    tenantId: 'direct',
    providerId: 'mock',
    productType: product.type,
  })

  // Ürünü DB'de bul veya oluştur
  let productId: string

  const { data: existingProduct } = await supabase
    .from('products')
    .select('id')
    .eq('external_id', product_external_id)
    .single()

  if (existingProduct) {
    productId = existingProduct.id
  } else {
    const { data: newProduct, error: pErr } = await supabase
      .from('products')
      .insert({
        provider_id: '00000000-0000-0000-0000-000000000000',
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

  // Demo tenant'ı bul (B2C satışlar için)
  const { data: directTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', 'direct')
    .single()

  // Yoksa demo tenant'ı kullan
  let tenantId: string
  if (directTenant) {
    tenantId = directTenant.id
  } else {
    const { data: demoTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', 'demo')
      .single()

    if (!demoTenant) {
      return NextResponse.json({ error: 'Platform yapılandırması eksik.' }, { status: 500 })
    }
    tenantId = demoTenant.id
  }

  // Rezervasyonu oluştur
  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .insert({
      tenant_id: tenantId,
      product_id: productId,
      customer_name,
      customer_email,
      customer_phone: customer_phone || null,
      base_price: pricing.basePrice,
      platform_commission: pricing.platformCommission,
      agency_commission: 0,
      total_price: pricing.totalPrice,
      currency: pricing.currency,
      status: 'pending',
      notes: notes || null,
      metadata: {
        product_title: product.title,
        product_type: product.type,
        external_id: product_external_id,
        source: 'b2c_storefront',
      },
    })
    .select()
    .single()

  if (bErr || !booking) {
    return NextResponse.json({ error: 'Rezervasyon oluşturulamadı.' }, { status: 500 })
  }

  // Müşteriye onay emaili gönder (hata olursa rezervasyonu engellemez)
  try {
    const emailData = bookingConfirmationEmail({
      bookingRef: booking.booking_ref,
      customerName: customer_name,
      productTitle: product.title,
      totalPrice: formatCurrency(pricing.totalPrice, pricing.currency),
      currency: pricing.currency,
      notes: notes || undefined,
    })
    await sendEmail({ to: customer_email, ...emailData })
  } catch {
    console.error('[B2C Booking] Email gönderilemedi, rezervasyon devam ediyor.')
  }

  return NextResponse.json({
    ok: true,
    booking_ref: booking.booking_ref,
    booking,
    pricing,
  }, { status: 201 })
}
