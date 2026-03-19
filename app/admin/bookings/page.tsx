'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatCurrency } from '@/lib/commission/engine'
import {
  BookOpen, CheckCircle, Clock, XCircle, TrendingUp,
  Building2, Search, ChevronDown, X,
} from 'lucide-react'
import { toast } from 'sonner'

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
  metadata: { product_title?: string; product_type?: string; external_id?: string }
  created_at: string
  tenants: { id: string; name: string; slug: string } | null
}

type Status = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'

const STATUS_CONFIG = {
  pending:   { label: 'Bekliyor',      icon: Clock,        className: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Onaylı',        icon: CheckCircle,  className: 'bg-green-100 text-green-700' },
  cancelled: { label: 'İptal',         icon: XCircle,      className: 'bg-red-100 text-red-700' },
  completed: { label: 'Tamamlandı',    icon: CheckCircle,  className: 'bg-blue-100 text-blue-700' },
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  tour:   'Tur',
  hotel:  'Otel',
  flight: 'Uçuş',
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.className}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

export default function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Booking | null>(null)
  const [statusFilter, setStatusFilter] = useState<Status>('all')
  const [agencyFilter, setAgencyFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/bookings')
    const data = await res.json()
    setBookings(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Unique agencies for filter dropdown
  const agencies = Array.from(
    new Map(
      bookings
        .filter(b => b.tenants)
        .map(b => [b.tenants!.id, b.tenants!])
    ).values()
  )

  const filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false
    if (agencyFilter !== 'all' && b.tenants?.id !== agencyFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !b.booking_ref.toLowerCase().includes(q) &&
        !b.customer_name.toLowerCase().includes(q) &&
        !b.customer_email.toLowerCase().includes(q) &&
        !(b.metadata?.product_title ?? '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  // Stats (all bookings, no filter)
  const active = bookings.filter(b => b.status !== 'cancelled')
  const totalRevenue = active.reduce((s, b) => s + b.total_price, 0)
  const totalPlatformComm = active.reduce((s, b) => s + b.platform_commission, 0)
  const totalAgencyComm = active.reduce((s, b) => s + b.agency_commission, 0)

  async function changeStatus(id: string, status: string) {
    setUpdatingStatus(true)
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    setUpdatingStatus(false)
    if (!res.ok) { toast.error(data.error); return }
    toast.success('Durum güncellendi')
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: data.status } : b))
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status: data.status } : null)
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tüm Rezervasyonlar</h1>
        <p className="text-slate-500 text-sm mt-1">Platform genelinde tüm acentaların rezervasyonları</p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Rezervasyon', value: bookings.length, suffix: 'adet', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Toplam Ciro', value: formatCurrency(totalRevenue), suffix: '', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Platform Komisyonu', value: formatCurrency(totalPlatformComm), suffix: '', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Acenta Komisyonları', value: formatCurrency(totalAgencyComm), suffix: '', icon: Building2, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white border rounded-xl p-4 flex items-start gap-3">
              <div className={`${s.bg} p-2 rounded-lg`}>
                <Icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  {s.value}{s.suffix ? <span className="text-sm font-normal text-slate-400 ml-1">{s.suffix}</span> : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Durum dağılımı */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'confirmed', 'cancelled', 'completed'] as const).map(s => {
          const count = s === 'all' ? bookings.length : bookings.filter(b => b.status === s).length
          const active = statusFilter === s
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {s === 'all' ? 'Tümü' : STATUS_CONFIG[s].label} <span className="ml-1 opacity-60">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ref, müşteri adı, email..."
            className="w-full border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative">
          <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={agencyFilter}
            onChange={e => setAgencyFilter(e.target.value)}
            className="border rounded-lg pl-9 pr-8 py-2 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">Tüm Acentalar</option>
            {agencies.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Yükleniyor...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">Rezervasyon bulunamadı.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 whitespace-nowrap">Ref</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 whitespace-nowrap">Acenta</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 whitespace-nowrap">Müşteri</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 whitespace-nowrap">Ürün</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-600 whitespace-nowrap">Tutar</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-600 whitespace-nowrap">Plt. Kom.</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-600 whitespace-nowrap">Aca. Kom.</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 whitespace-nowrap">Durum</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600 whitespace-nowrap">Tarih</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(b => (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50 cursor-pointer transition-colors ${selected?.id === b.id ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelected(selected?.id === b.id ? null : b)}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-600 whitespace-nowrap">{b.booking_ref}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        {b.tenants?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-900">{b.customer_name}</div>
                      <div className="text-xs text-slate-400">{b.customer_email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-700 max-w-[180px] truncate">{b.metadata?.product_title ?? '—'}</div>
                      {b.metadata?.product_type && (
                        <div className="text-xs text-slate-400">{PRODUCT_TYPE_LABELS[b.metadata.product_type] ?? b.metadata.product_type}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {formatCurrency(b.total_price, b.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-orange-600 font-medium whitespace-nowrap">
                      {formatCurrency(b.platform_commission, b.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-green-600 font-medium whitespace-nowrap">
                      {formatCurrency(b.agency_commission, b.currency)}
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(b.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detay paneli */}
      {selected && (
        <div className="bg-white border rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900 text-lg">{selected.booking_ref}</h3>
                <StatusBadge status={selected.status} />
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {selected.metadata?.product_title} · {selected.tenants?.name}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            {/* Müşteri */}
            <div className="space-y-2">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Müşteri Bilgileri</p>
              <p className="font-medium text-slate-900">{selected.customer_name}</p>
              <p className="text-slate-500">{selected.customer_email}</p>
              {selected.customer_phone && <p className="text-slate-500">{selected.customer_phone}</p>}
              {selected.notes && <p className="text-slate-400 italic text-xs mt-2">Not: {selected.notes}</p>}
            </div>

            {/* Fiyat dökümü */}
            <div className="space-y-2">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Fiyat Dökümü</p>
              <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Sağlayıcı fiyatı</span>
                  <span>{formatCurrency(selected.base_price, selected.currency)}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Platform komisyonu</span>
                  <span>+{formatCurrency(selected.platform_commission, selected.currency)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Acenta komisyonu</span>
                  <span>+{formatCurrency(selected.agency_commission, selected.currency)}</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between font-semibold text-slate-900">
                  <span>Toplam</span>
                  <span>{formatCurrency(selected.total_price, selected.currency)}</span>
                </div>
              </div>
            </div>

            {/* Durum değiştir */}
            <div className="space-y-2">
              <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Durum Güncelle</p>
              <div className="grid grid-cols-2 gap-2">
                {(['pending', 'confirmed', 'completed', 'cancelled'] as const).map(s => {
                  const cfg = STATUS_CONFIG[s]
                  const Icon = cfg.icon
                  const isCurrent = selected.status === s
                  return (
                    <button
                      key={s}
                      disabled={isCurrent || updatingStatus}
                      onClick={() => changeStatus(selected.id, s)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                        isCurrent
                          ? `${cfg.className} border-transparent`
                          : 'text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                      } disabled:opacity-60`}
                    >
                      <Icon size={12} />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
