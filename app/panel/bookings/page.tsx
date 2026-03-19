'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/commission/engine'
import { BookOpen, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Booking {
  id: string
  booking_ref: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  base_price: number
  platform_commission: number
  agency_commission: number
  total_price: number
  currency: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  metadata: { product_title?: string; product_type?: string }
  created_at: string
}

const statusConfig = {
  pending:   { label: 'Bekliyor',  icon: Clock,        className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Onaylı',   icon: CheckCircle,  className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal',    icon: XCircle,      className: 'bg-red-100 text-red-700' },
  completed: { label: 'Tamamlandı',icon: CheckCircle, className: 'bg-blue-100 text-blue-700' },
}

export default function AgencyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Booking | null>(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/panel/bookings')
    const data = await res.json()
    setBookings(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  const totalRevenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.total_price, 0)
  const totalCommission = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + b.agency_commission, 0)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Rezervasyonlar</h1>
        <p className="text-slate-500 text-sm mt-1">Acentanıza ait tüm rezervasyonlar</p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Toplam', value: bookings.length, suffix: 'adet' },
          { label: 'Onaylı', value: bookings.filter(b => b.status === 'confirmed').length, suffix: 'adet' },
          { label: 'Toplam Ciro', value: formatCurrency(totalRevenue), suffix: '' },
          { label: 'Komisyonum', value: formatCurrency(totalCommission), suffix: '' },
        ].map(s => (
          <div key={s.label} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{s.value} <span className="text-sm font-normal text-slate-400">{s.suffix}</span></p>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">Henüz rezervasyon yok.</p>
            <p className="text-slate-400 text-xs mt-1">Ürünler sayfasından rezervasyon oluşturabilirsiniz.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Ref</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Müşteri</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Ürün</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Tutar</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Komisyonum</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Durum</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map(b => {
                const sc = statusConfig[b.status]
                const StatusIcon = sc.icon
                return (
                  <tr
                    key={b.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelected(selected?.id === b.id ? null : b)}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600">{b.booking_ref}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{b.customer_name}</div>
                      <div className="text-xs text-slate-400">{b.customer_email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate">
                      {b.metadata?.product_title ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {formatCurrency(b.total_price, b.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-green-600 font-medium">
                      {formatCurrency(b.agency_commission, b.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sc.className}`}>
                        <StatusIcon size={11} />
                        {sc.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detay paneli */}
      {selected && (
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">{selected.booking_ref}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{selected.metadata?.product_title}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Müşteri</p>
              <p className="font-medium">{selected.customer_name}</p>
              <p className="text-slate-500">{selected.customer_email}</p>
              {selected.customer_phone && <p className="text-slate-500">{selected.customer_phone}</p>}
              {selected.notes && <p className="text-slate-400 italic text-xs mt-2">Not: {selected.notes}</p>}
            </div>
            <div className="space-y-2">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Fiyat Dökümü</p>
              <div className="bg-slate-50 rounded-lg p-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Sağlayıcı fiyatı</span>
                  <span>{formatCurrency(selected.base_price, selected.currency)}</span>
                </div>
                <div className="flex justify-between text-blue-600">
                  <span>Platform komisyonu</span>
                  <span>+{formatCurrency(selected.platform_commission, selected.currency)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Acenta komisyonu</span>
                  <span>+{formatCurrency(selected.agency_commission, selected.currency)}</span>
                </div>
                <div className="border-t pt-1 flex justify-between font-semibold text-slate-900">
                  <span>Toplam</span>
                  <span>{formatCurrency(selected.total_price, selected.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
