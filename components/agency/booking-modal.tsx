'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { formatCurrency, calculatePrice } from '@/lib/commission/engine'
import { CheckCircle, X } from 'lucide-react'

interface Product {
  externalId: string
  type: string
  title: string
  description: string
  basePrice: number
  currency: string
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

interface Props {
  open: boolean
  product: Product | null
  providerId?: string
  onClose: () => void
}

export function BookingModal({ open, product, providerId, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'success'>('form')
  const [loading, setLoading] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [platformRules, setPlatformRules] = useState<CommissionRule[]>([])
  const [agencyRules, setAgencyRules] = useState<CommissionRule[]>([])
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', notes: '' })

  useEffect(() => {
    if (open) {
      setStep('form')
      setForm({ customer_name: '', customer_email: '', customer_phone: '', notes: '' })
      // Komisyon kurallarını çek
      fetch('/api/panel/commissions')
        .then(r => r.json())
        .then(d => {
          setPlatformRules(d.platformRules ?? [])
          setAgencyRules(d.agencyRules ?? [])
        })
    }
  }, [open])

  if (!open || !product) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pricing = calculatePrice({
    basePrice: product.basePrice,
    currency: product.currency,
    platformRules: platformRules as any,
    agencyRules: agencyRules as any,
    tenantId: 'current',
    providerId: providerId ?? 'mock',
    productType: product.type,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_external_id: product!.externalId,
        provider_id: providerId,
        ...form,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(data.error)
      return
    }

    setBookingRef(data.booking_ref)
    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {step === 'success' ? (
          /* Başarı ekranı */
          <div className="p-8 text-center space-y-4">
            <CheckCircle size={56} className="mx-auto text-green-500" />
            <h2 className="text-xl font-bold text-slate-900">Rezervasyon Oluşturuldu!</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-slate-600">Rezervasyon Kodu</p>
              <p className="text-2xl font-bold text-green-700 font-mono mt-1">{bookingRef}</p>
            </div>
            <p className="text-sm text-slate-500">
              Müşteri <strong>{form.customer_email}</strong> adresine bilgilendirme gönderilecek.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                Kapat
              </button>
              <button
                onClick={() => { setStep('form'); setForm({ customer_name: '', customer_email: '', customer_phone: '', notes: '' }) }}
                className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition"
              >
                Yeni Rezervasyon
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <>
            <div className="px-6 py-4 border-b flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Rezervasyon Oluştur</h2>
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">{product.title}</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-0.5">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Fiyat dökümü */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                <p className="font-medium text-slate-700 mb-3">Fiyat Detayı</p>
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
                <div className="border-t pt-2 flex justify-between font-bold text-slate-900 text-base">
                  <span>Toplam</span>
                  <span>{formatCurrency(pricing.totalPrice, pricing.currency)}</span>
                </div>
              </div>

              {/* Müşteri bilgileri */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Müşteri Adı Soyadı *</label>
                <input
                  value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ahmet Yılmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ahmet@ornek.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                <input
                  value={form.customer_phone}
                  onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+90 555 000 0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notlar</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Özel istekler, notlar..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
                  İptal
                </button>
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Kaydediliyor...' : `Rezervasyon Oluştur · ${formatCurrency(pricing.totalPrice, pricing.currency)}`}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
