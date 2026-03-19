'use client'

import { useState, useEffect } from 'react'
import { Plane, Hotel, MapPin, Car, Package } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { calculatePrice, formatCurrency } from '@/lib/commission/engine'
import { BookingModal } from '@/components/agency/booking-modal'

interface Product {
  externalId: string
  type: 'flight' | 'hotel' | 'tour' | 'transfer' | 'package'
  title: string
  description: string
  basePrice: number
  currency: string
  metadata: Record<string, unknown>
}

interface CommissionRule {
  id: string
  name: string
  tenant_id: string | null
  provider_id: string | null
  product_type: string | null
  commission_type: 'percentage' | 'fixed'
  value: number
  min_amount: number | null
  max_amount: number | null
  is_active: boolean
  priority: number
  created_at: string
  updated_at: string
}

const typeConfig = {
  tour:     { label: 'Tur',      icon: MapPin, color: 'bg-green-100 text-green-700' },
  hotel:    { label: 'Otel',     icon: Hotel,  color: 'bg-blue-100 text-blue-700' },
  flight:   { label: 'Uçuş',    icon: Plane,  color: 'bg-purple-100 text-purple-700' },
  transfer: { label: 'Transfer', icon: Car,    color: 'bg-orange-100 text-orange-700' },
  package:  { label: 'Paket',   icon: Package,color: 'bg-rose-100 text-rose-700' },
}

export default function AgencyProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [platformRules, setPlatformRules] = useState<CommissionRule[]>([])
  const [agencyRules, setAgencyRules] = useState<CommissionRule[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/panel/commissions').then(r => r.json()),
    ]).then(([prods, commissions]) => {
      setProducts(prods)
      setPlatformRules(commissions.platformRules ?? [])
      setAgencyRules(commissions.agencyRules ?? [])
      setLoading(false)
    })
  }, [])

  function openBooking(product: Product) {
    setSelectedProduct(product)
    setModalOpen(true)
  }

  if (loading) {
    return <div className="p-8 text-slate-400 text-sm">Yükleniyor...</div>
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ürün Kataloğu</h1>
        <p className="text-slate-500 text-sm mt-1">
          Platform üzerindeki tüm aktif ürünler — fiyatlar komisyon dahildir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {products.map(product => {
          const cfg = typeConfig[product.type]
          const IconComp = cfg.icon
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pricing = calculatePrice({
            basePrice: product.basePrice,
            currency: product.currency,
            platformRules: platformRules as any,
            agencyRules: agencyRules as any,
            tenantId: 'current',
            providerId: 'mock',
            productType: product.type,
          })

          return (
            <Card key={product.externalId} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">{product.title}</CardTitle>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.color}`}>
                    <IconComp size={12} />
                    {cfg.label}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4">
                <p className="text-sm text-slate-500 flex-1">{product.description}</p>

                <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Sağlayıcı fiyatı</span>
                    <span>{formatCurrency(pricing.basePrice, pricing.currency)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Platform komisyonu</span>
                    <span>+{formatCurrency(pricing.platformCommission, pricing.currency)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Acenta komisyonu</span>
                    <span>+{formatCurrency(pricing.agencyCommission, pricing.currency)}</span>
                  </div>
                  <div className="border-t pt-1 flex justify-between font-semibold text-slate-900 text-sm">
                    <span>Satış fiyatı</span>
                    <span>{formatCurrency(pricing.totalPrice, pricing.currency)}</span>
                  </div>
                </div>

                <button
                  onClick={() => openBooking(product)}
                  className="w-full text-sm bg-slate-900 text-white rounded-lg py-2 hover:bg-slate-700 transition"
                >
                  Rezervasyon Oluştur
                </button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <BookingModal
        open={modalOpen}
        product={selectedProduct}
        onClose={() => { setModalOpen(false); setSelectedProduct(null) }}
      />
    </div>
  )
}
