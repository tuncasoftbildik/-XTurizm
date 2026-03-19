'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/commission/engine'
import { CheckCircle, X, ArrowLeft, Plane, Hotel, MapPin } from 'lucide-react'

interface Product {
  externalId: string
  type: 'flight' | 'hotel' | 'tour' | 'transfer' | 'package'
  title: string
  description: string
  totalPrice: number
  currency: string
  metadata: Record<string, unknown>
}

interface Props {
  open: boolean
  product: Product | null
  onClose: () => void
}

const typeIcon = { tour: MapPin, hotel: Hotel, flight: Plane, transfer: MapPin, package: MapPin }
const typeLabel: Record<string, string> = { tour: 'Tur', hotel: 'Otel', flight: 'Uçuş', transfer: 'Transfer', package: 'Paket' }

export function StorefrontBookingModal({ open, product, onClose }: Props) {
  const [step, setStep] = useState<'detail' | 'form' | 'success'>('detail')
  const [loading, setLoading] = useState(false)
  const [bookingRef, setBookingRef] = useState('')
  const [form, setForm] = useState({ customer_name: '', customer_email: '', customer_phone: '', notes: '' })

  if (!open || !product) return null

  const Icon = typeIcon[product.type]

  function resetAndClose() {
    setStep('detail')
    setForm({ customer_name: '', customer_email: '', customer_phone: '', notes: '' })
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/bookings/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_external_id: product!.externalId,
        ...form,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      toast.error(data.error || 'Bir hata oluştu.')
      return
    }

    setBookingRef(data.booking_ref)
    setStep('success')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* ======== ADIM 3: Başarı ======== */}
        {step === 'success' && (
          <div className="p-8 text-center space-y-4">
            <CheckCircle size={56} className="mx-auto text-green-500" />
            <h2 className="text-xl font-bold text-slate-900">Rezervasyonunuz Alındı!</h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-slate-600">Rezervasyon Kodu</p>
              <p className="text-2xl font-bold text-green-700 font-mono mt-1">{bookingRef}</p>
            </div>
            <p className="text-sm text-slate-500">
              Onay bilgileri <strong>{form.customer_email}</strong> adresine gönderilecektir.
            </p>
            <button
              onClick={resetAndClose}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition"
            >
              Tamam
            </button>
          </div>
        )}

        {/* ======== ADIM 1: Ürün Detayı ======== */}
        {step === 'detail' && (
          <>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon size={18} className="text-blue-600" />
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  {typeLabel[product.type]}
                </span>
              </div>
              <button onClick={resetAndClose} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">{product.title}</h2>
              <p className="text-sm text-slate-500">{product.description}</p>

              {/* Metadata bilgileri */}
              {product.metadata && (() => {
                const m = product.metadata as Record<string, string | number | string[]>
                return (
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  {m.destination && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Destinasyon</span>
                      <span className="text-slate-900 font-medium">{String(m.destination)}</span>
                    </div>
                  )}
                  {m.duration && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Süre</span>
                      <span className="text-slate-900 font-medium">{String(m.duration)} gün</span>
                    </div>
                  )}
                  {m.stars && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Yıldız</span>
                      <span className="text-slate-900 font-medium">{'★'.repeat(Number(m.stars))}</span>
                    </div>
                  )}
                  {m.board && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Pansiyon</span>
                      <span className="text-slate-900 font-medium">
                        {m.board === 'all-inclusive' ? 'Her Şey Dahil' : m.board === 'BB' ? 'Oda + Kahvaltı' : String(m.board)}
                      </span>
                    </div>
                  )}
                  {m.airline && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Havayolu</span>
                      <span className="text-slate-900 font-medium">{String(m.airline)}</span>
                    </div>
                  )}
                  {Array.isArray(m.includes) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Dahil</span>
                      <span className="text-slate-900 font-medium">{(m.includes as string[]).join(', ')}</span>
                    </div>
                  )}
                </div>
                )})()}

              <div className="border-t pt-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Toplam fiyat</div>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(product.totalPrice, product.currency)}
                  </div>
                </div>
                <button
                  onClick={() => setStep('form')}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                >
                  Rezervasyon Yap
                </button>
              </div>
            </div>
          </>
        )}

        {/* ======== ADIM 2: Müşteri Formu ======== */}
        {step === 'form' && (
          <>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep('detail')} className="text-slate-400 hover:text-slate-600">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Bilgilerinizi Girin</h2>
                  <p className="text-xs text-slate-500 line-clamp-1">{product.title}</p>
                </div>
              </div>
              <button onClick={resetAndClose} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad *</label>
                <input
                  value={form.customer_name}
                  onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ahmet Yılmaz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta *</label>
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

              {/* Fiyat özeti */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Ödenecek Tutar</span>
                <span className="text-lg font-bold text-blue-700">
                  {formatCurrency(product.totalPrice, product.currency)}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('detail')}
                  className="flex-1 border rounded-lg py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition"
                >
                  Geri
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? 'İşleniyor...' : 'Rezervasyonu Onayla'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
