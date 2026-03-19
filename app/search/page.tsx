import { searchProducts } from '@/lib/providers/mock'
import { calculatePrice } from '@/lib/commission/engine'
import { ProductGrid } from '@/components/storefront/product-grid'
import Link from 'next/link'

const mockPlatformRule = {
  id: 'mock-platform', name: 'Platform Default', tenant_id: null,
  provider_id: null, product_type: null, commission_type: 'percentage' as const,
  value: 10, min_amount: null, max_amount: null, is_active: true, priority: 0,
  created_at: '', updated_at: '',
}

export default async function SearchPage() {
  const products = await searchProducts({})

  const productsWithPricing = products.map(product => {
    const pricing = calculatePrice({
      basePrice: product.basePrice,
      currency: product.currency,
      platformRules: [mockPlatformRule],
      agencyRules: [],
      tenantId: 'storefront',
      providerId: 'mock',
      productType: product.type,
    })

    return {
      externalId: product.externalId,
      type: product.type,
      title: product.title,
      description: product.description,
      totalPrice: pricing.totalPrice,
      currency: pricing.currency,
      metadata: product.metadata as Record<string, unknown>,
    }
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-blue-300 text-sm hover:text-white mb-4 block">← Ana Sayfa</Link>
          <h1 className="text-3xl font-bold">Ürün Arama</h1>
          <p className="text-blue-300 mt-2">Turlar, oteller ve uçuşlar arasından seçim yapın</p>
        </div>
      </header>

      {/* Ürünler */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ProductGrid products={productsWithPricing} />
      </div>
    </div>
  )
}
