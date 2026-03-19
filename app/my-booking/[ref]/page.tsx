'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/commission/engine'
import {
  CheckCircle, Clock, XCircle, AlertCircle, Mail, Phone,
  FileText, ArrowRight, MapPin, Tag,
} from 'lucide-react'

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
  metadata: { product_title?: string; product_type?: string; destination?: string }
  created_at: string
  tenants: {
    name: string
    contact_email: string
    contact_phone: string | null
    logo_url: string | null
    primary_color: string
    slug: string
  } | null
}

const STATUS: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  confirmed:  { label: 'Onaylandı',    color: 'text-green-700',  bg: 'bg-green-50  border-green-200',  icon: CheckCircle },
  completed:  { label: 'Tamamlandı',   color: 'text-blue-700',   bg: 'bg-blue-50   border-blue-200',   icon: CheckCircle },
  pending:    { label: 'Beklemede',    color: 'text-amber-700',  bg: 'bg-amber-50  border-amber-200',  icon: Clock },
  cancelled:  { label: 'İptal Edildi', color: 'text-red-700',    bg: 'bg-red-50    border-red-200',    icon: XCircle },
}

const TYPE_LABELS: Record<string, string> = {
  tour: 'Tur', hotel: 'Otel', flight: 'Uçuş', transfer: 'Transfer', package: 'Paket',
}

export default function MyBookingPage() {
  const { ref } = useParams<{ ref: string }>()
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/my-booking/${ref}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Doğrulama başarısız.')
      return
    }

    setBooking(data)
    setVerified(true)
  }

  const primary = booking?.tenants?.primary_color ?? '#0f172a'

  // --- Doğrulama Ekranı ---
  if (!verified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-6 text-center" style={{ backgroundColor: primary }}>
            <div className="text-white/80 text-xs uppercase tracking-widest mb-1">Rezervasyon Sorgulama</div>
            <div className="text-white text-2xl font-black font-mono">{ref}</div>
          </div>

          <div className="px-8 py-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <Mail size={24} className="text-slate-500" />
              </div>
            </div>
            <h2 className="text-center text-xl font-bold text-slate-900 mb-2">Kimliğinizi Doğrulayın</h2>
            <p className="text-center text-slate-500 text-sm mb-8">
              Rezervasyonu görüntülemek için kayıtlı e-posta adresinizi girin.
            </p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
                style={{ backgroundColor: primary }}
              >
                {loading ? 'Doğrulanıyor...' : (
                  <><span>Rezervasyonu Görüntüle</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // --- Rezervasyon Detay Ekranı ---
  if (!booking) return null

  const status = STATUS[booking.status] ?? STATUS.pending
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="w-full max-w-xl mx-auto space-y-4">

        {/* Acenta Header */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1.5 w-full" style={{ backgroundColor: primary }} />
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              {booking.tenants?.logo_url ? (
                <Image
                  src={booking.tenants.logo_url}
                  alt={booking.tenants.name}
                  width={120}
                  height={50}
                  style={{ height: 'auto', maxHeight: '44px', width: 'auto' }}
                  className="object-contain"
                />
              ) : (
                <div className="font-bold text-lg" style={{ color: primary }}>{booking.tenants?.name}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 mb-0.5">Rezervasyon No</div>
              <div className="font-black font-mono text-lg" style={{ color: primary }}>{booking.booking_ref}</div>
            </div>
          </div>
        </div>

        {/* Durum */}
        <div className={`rounded-2xl border px-6 py-4 flex items-center gap-3 ${status.bg}`}>
          <StatusIcon size={22} className={status.color} />
          <div>
            <div className={`font-semibold ${status.color}`}>{status.label}</div>
            <div className="text-xs text-slate-500">
              {new Date(booking.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Ürün */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Ürün / Hizmet</div>
          <div className="font-bold text-slate-900 text-lg leading-tight">
            {booking.metadata?.product_title ?? '—'}
          </div>
          <div className="flex flex-wrap gap-2">
            {booking.metadata?.product_type && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 rounded-full px-3 py-1">
                <Tag size={11} /> {TYPE_LABELS[booking.metadata.product_type] ?? booking.metadata.product_type}
              </span>
            )}
            {booking.metadata?.destination && (
              <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 rounded-full px-3 py-1">
                <MapPin size={11} /> {String(booking.metadata.destination)}
              </span>
            )}
          </div>
        </div>

        {/* Müşteri Bilgileri */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Müşteri Bilgileri</div>
          <div className="font-semibold text-slate-900">{booking.customer_name}</div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Mail size={14} /> {booking.customer_email}
          </div>
          {booking.customer_phone && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Phone size={14} /> {booking.customer_phone}
            </div>
          )}
        </div>

        {/* Fiyat */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Ödeme</div>
          <div className="flex items-end justify-between">
            <div className="text-slate-500 text-sm">Toplam Tutar</div>
            <div className="text-2xl font-black" style={{ color: primary }}>
              {formatCurrency(booking.total_price, booking.currency)}
            </div>
          </div>
          {booking.notes && (
            <div className="pt-3 border-t">
              <div className="text-xs text-slate-400 mb-1">Notlar</div>
              <div className="text-slate-600 text-sm">{booking.notes}</div>
            </div>
          )}
        </div>

        {/* İletişim */}
        {(booking.tenants?.contact_email || booking.tenants?.contact_phone) && (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
            <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">İletişim</div>
            {booking.tenants.contact_email && (
              <a href={`mailto:${booking.tenants.contact_email}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
                <Mail size={14} /> {booking.tenants.contact_email}
              </a>
            )}
            {booking.tenants.contact_phone && (
              <a href={`tel:${booking.tenants.contact_phone}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition">
                <Phone size={14} /> {booking.tenants.contact_phone}
              </a>
            )}
          </div>
        )}

        {/* Makbuz Linki */}
        <Link
          href={`/receipt/${booking.booking_ref}`}
          className="w-full flex items-center justify-center gap-2 border-2 rounded-2xl py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          style={{ borderColor: primary + '40' }}
        >
          <FileText size={16} style={{ color: primary }} />
          Makbuzu Görüntüle / Yazdır
        </Link>

      </div>
    </div>
  )
}
