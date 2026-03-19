'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { formatCurrency } from '@/lib/commission/engine'
import { Printer, CheckCircle } from 'lucide-react'
import Image from 'next/image'

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
  status: string
  notes: string | null
  metadata: { product_title?: string; product_type?: string }
  created_at: string
  tenants: {
    name: string
    contact_email: string
    contact_phone: string | null
    logo_url: string | null
    primary_color: string
  } | null
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Onaylandı',
  pending: 'Beklemede',
  cancelled: 'İptal Edildi',
  completed: 'Tamamlandı',
}

const TYPE_LABELS: Record<string, string> = {
  tour: 'Tur',
  hotel: 'Otel',
  flight: 'Uçuş',
  transfer: 'Transfer',
  package: 'Paket',
}

export default function ReceiptPage() {
  const { ref } = useParams<{ ref: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const printTriggered = useRef(false)

  useEffect(() => {
    fetch(`/api/receipt/${ref}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setBooking(d)
      })
      .catch(() => setError('Yüklenemedi'))
      .finally(() => setLoading(false))
  }, [ref])

  // Auto-print query param: /receipt/REF?print=1
  useEffect(() => {
    if (booking && !printTriggered.current && new URLSearchParams(window.location.search).get('print') === '1') {
      printTriggered.current = true
      setTimeout(() => window.print(), 500)
    }
  }, [booking])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Yükleniyor...</div>
  if (error || !booking) return <div className="min-h-screen flex items-center justify-center text-slate-400">{error ?? 'Rezervasyon bulunamadı'}</div>

  const primary = booking.tenants?.primary_color ?? '#1e40af'
  const netCost = booking.base_price + booking.platform_commission

  return (
    <>
      {/* Yazdır butonu — baskıda gizlenir */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium shadow-lg hover:opacity-90 transition"
          style={{ backgroundColor: primary }}
        >
          <Printer size={15} />
          Yazdır / PDF Kaydet
        </button>
      </div>

      {/* Makbuz */}
      <div className="min-h-screen bg-slate-100 flex items-start justify-center py-10 print:bg-white print:py-0">
        <div className="w-full max-w-2xl bg-white shadow-xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none">

          {/* Header — Logo bölümü (beyaz) */}
          <div className="px-8 py-5 flex items-center justify-between border-b">
            <div>
              {booking.tenants?.logo_url ? (
                <Image
                  src={booking.tenants.logo_url}
                  alt={booking.tenants.name}
                  width={140}
                  height={70}
                  style={{ height: 'auto', maxHeight: '60px', width: 'auto' }}
                  className="object-contain"
                />
              ) : (
                <div className="text-xl font-bold" style={{ color: primary }}>{booking.tenants?.name ?? 'Acenta'}</div>
              )}
              <div className="text-slate-400 text-xs mt-1">{booking.tenants?.contact_email}</div>
              {booking.tenants?.contact_phone && <div className="text-slate-400 text-xs">{booking.tenants.contact_phone}</div>}
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-xs uppercase tracking-widest mb-1">Rezervasyon Makbuzu</div>
              <div className="text-2xl font-black font-mono" style={{ color: primary }}>{booking.booking_ref}</div>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: primary }}>
                <CheckCircle size={11} />
                {STATUS_LABELS[booking.status] ?? booking.status}
              </div>
            </div>
          </div>
          {/* Renkli şerit */}
          <div className="h-1.5 w-full" style={{ backgroundColor: primary }} />

          {/* Body */}
          <div className="px-8 py-6 space-y-6">

            {/* Ürün */}
            <div className="border rounded-xl p-4 bg-slate-50">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Ürün / Hizmet</div>
              <div className="font-semibold text-slate-900 text-lg">{booking.metadata?.product_title ?? '—'}</div>
              {booking.metadata?.product_type && (
                <div className="text-slate-500 text-sm mt-0.5">{TYPE_LABELS[booking.metadata.product_type] ?? booking.metadata.product_type}</div>
              )}
            </div>

            {/* Müşteri + Tarih */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Müşteri Bilgileri</div>
                <div className="font-semibold text-slate-900">{booking.customer_name}</div>
                <div className="text-slate-500 text-sm">{booking.customer_email}</div>
                {booking.customer_phone && <div className="text-slate-500 text-sm">{booking.customer_phone}</div>}
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Rezervasyon Tarihi</div>
                <div className="font-semibold text-slate-900">
                  {new Date(booking.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <div className="text-slate-500 text-sm">
                  {new Date(booking.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Fiyat */}
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Fiyat Detayı</div>
              <div className="border rounded-xl overflow-hidden">
                <div className="divide-y">
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-500">Net fiyat</span>
                    <span className="text-slate-700">{formatCurrency(netCost, booking.currency)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-slate-500">Komisyon</span>
                    <span className="text-slate-700">{formatCurrency(booking.agency_commission, booking.currency)}</span>
                  </div>
                  <div className="flex justify-between px-4 py-3 font-bold text-base" style={{ backgroundColor: primary + '15' }}>
                    <span style={{ color: primary }}>Toplam Tutar</span>
                    <span style={{ color: primary }}>{formatCurrency(booking.total_price, booking.currency)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Not */}
            {booking.notes && (
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Notlar</div>
                <p className="text-slate-600 text-sm">{booking.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t bg-slate-50 text-center text-xs text-slate-400">
            Bu belge {booking.tenants?.name ?? 'acenta'} tarafından düzenlenmiştir. • Powered by XTurizm
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { margin: 0; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  )
}
