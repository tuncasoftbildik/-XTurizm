'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/commission/engine'
import { Plane, Hotel, MapPin } from 'lucide-react'
import { StorefrontBookingModal } from './booking-modal'

interface ProductWithPricing {
  externalId: string
  type: 'flight' | 'hotel' | 'tour' | 'transfer' | 'package'
  title: string
  description: string
  totalPrice: number
  currency: string
  metadata: Record<string, unknown>
}

const typeIcon = { tour: MapPin, hotel: Hotel, flight: Plane, transfer: MapPin, package: MapPin }
const typeLabel: Record<string, string> = { tour: 'Tur', hotel: 'Otel', flight: 'Uçuş', transfer: 'Transfer', package: 'Paket' }
const typeAll = ['all', 'tour', 'hotel', 'flight'] as const

export function ProductGrid({ products }: { products: ProductWithPricing[] }) {
  const [selectedProduct, setSelectedProduct] = useState<ProductWithPricing | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = products.filter(p => {
    if (filter !== 'all' && p.type !== filter) return false
    if (search) {
      const kw = search.toLowerCase()
      return p.title.toLowerCase().includes(kw) || p.description.toLowerCase().includes(kw)
    }
    return true
  })

  return (
    <>
      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2">
          {typeAll.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === t
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border hover:bg-slate-50'
              }`}
            >
              {t === 'all' ? 'Tümü' : typeLabel[t]}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Ürün ara..."
          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:ml-auto sm:w-64"
        />
      </div>

      <p className="text-slate-500 text-sm mb-4">{filtered.length} ürün bulundu</p>

      {/* Ürün Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(product => {
          const Icon = typeIcon[product.type]

          return (
            <div
              key={product.externalId}
              className="bg-white rounded-xl shadow-sm border hover:shadow-md transition cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Icon size={16} className="text-blue-600" />
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                    {typeLabel[product.type]}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 leading-snug">{product.title}</h3>
                <p className="text-sm text-slate-500">{product.description}</p>
                <div className="pt-2 border-t flex items-center justify-between">
                  <div>
                    <div className="text-xs text-slate-400">itibaren</div>
                    <div className="text-xl font-bold text-slate-900">
                      {formatCurrency(product.totalPrice, product.currency)}
                    </div>
                  </div>
                  <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                    İncele
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p>Aramanıza uygun ürün bulunamadı.</p>
        </div>
      )}

      {/* Booking Modal */}
      <StorefrontBookingModal
        open={!!selectedProduct}
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  )
}
