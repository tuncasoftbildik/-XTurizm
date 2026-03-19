import { createClient } from '@/lib/supabase/server'
import { searchProducts } from '@/lib/providers/mock'
import { calculatePrice } from '@/lib/commission/engine'
import { NextResponse } from 'next/server'

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Tenant bilgisi — anon okuma gerekiyor (aşağıdaki SQL'i Supabase'de çalıştırın)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, logo_url, primary_color, secondary_color')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Acenta bulunamadı' }, { status: 404 })
  }

  // Komisyon kuralları
  const { data: platformRules } = await supabase
    .from('commission_rules')
    .select('*')
    .is('tenant_id', null)
    .eq('is_active', true)

  const { data: agencyRules } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)

  // Ürünler (mock provider)
  const products = await searchProducts({})

  // Fiyat hesapla — müşteriye sadece toplam fiyat gider
  const priced = products.map(p => {
    const pricing = calculatePrice({
      basePrice: p.basePrice,
      currency: p.currency,
      platformRules: platformRules ?? [],
      agencyRules: agencyRules ?? [],
      tenantId: tenant.id,
      providerId: 'mock',
      productType: p.type,
    })
    return {
      externalId: p.externalId,
      type: p.type,
      title: p.title,
      description: p.description,
      currency: pricing.currency,
      price: pricing.totalPrice,           // müşteri fiyatı
      metadata: p.metadata,
      availableFrom: p.availableFrom,
      availableTo: p.availableTo,
    }
  })

  return NextResponse.json({ tenant, products: priced })
}
