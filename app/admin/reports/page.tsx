'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { formatCurrency } from '@/lib/commission/engine'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { TrendingUp, BookOpen, Building2, Layers, ChevronDown } from 'lucide-react'

interface Booking {
  id: string
  created_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  base_price: number
  platform_commission: number
  agency_commission: number
  total_price: number
  currency: string
  metadata: { product_type?: string }
  tenants: { id: string; name: string; slug: string } | null
}

type Period = '7d' | '30d' | '90d' | '12m'

const PERIOD_LABELS: Record<Period, string> = {
  '7d':  'Son 7 Gün',
  '30d': 'Son 30 Gün',
  '90d': 'Son 90 Gün',
  '12m': 'Son 12 Ay',
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  tour:   'Tur',
  hotel:  'Otel',
  flight: 'Uçuş',
}

const AGENCY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

function periodStart(period: Period): Date {
  const now = new Date()
  switch (period) {
    case '7d':  return new Date(now.getTime() - 7  * 86400000)
    case '30d': return new Date(now.getTime() - 30 * 86400000)
    case '90d': return new Date(now.getTime() - 90 * 86400000)
    case '12m': return new Date(now.getTime() - 365 * 86400000)
  }
}

function bucketKey(date: Date, period: Period): string {
  if (period === '12m') {
    return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' })
  }
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

function bucketRange(start: Date, period: Period): string[] {
  const keys: string[] = []
  const end = new Date()
  if (period === '12m') {
    const cur = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cur <= end) {
      keys.push(cur.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' }))
      cur.setMonth(cur.getMonth() + 1)
    }
  } else {
    const cur = new Date(start)
    cur.setHours(0, 0, 0, 0)
    while (cur <= end) {
      keys.push(cur.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }))
      cur.setDate(cur.getDate() + 1)
    }
  }
  return keys
}

export default function AdminReports() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('30d')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/reports')
    const data = await res.json()
    setBookings(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const start = useMemo(() => periodStart(period), [period])

  // Filter to selected period and exclude cancelled
  const periodActive = useMemo(() =>
    bookings.filter(b => b.status !== 'cancelled' && new Date(b.created_at) >= start),
    [bookings, start]
  )

  // All (for status pie)
  const periodAll = useMemo(() =>
    bookings.filter(b => new Date(b.created_at) >= start),
    [bookings, start]
  )

  // --- KPI ---
  const totalRevenue = periodActive.reduce((s, b) => s + b.total_price, 0)
  const totalPlatformComm = periodActive.reduce((s, b) => s + b.platform_commission, 0)
  const totalAgencyComm = periodActive.reduce((s, b) => s + b.agency_commission, 0)

  // --- Zaman serisi (ciro + komisyon) ---
  const timelineData = useMemo(() => {
    const keys = bucketRange(start, period)
    const map: Record<string, { ciro: number; platform: number; acenta: number; rezervasyon: number }> =
      Object.fromEntries(keys.map(k => [k, { ciro: 0, platform: 0, acenta: 0, rezervasyon: 0 }]))

    periodActive.forEach(b => {
      const key = bucketKey(new Date(b.created_at), period)
      if (map[key]) {
        map[key].ciro += b.total_price
        map[key].platform += b.platform_commission
        map[key].acenta += b.agency_commission
        map[key].rezervasyon += 1
      }
    })

    return keys.map(k => ({ tarih: k, ...map[k] }))
  }, [periodActive, period, start])

  // --- Acenta bazlı gelir ---
  const agencyData = useMemo(() => {
    const map: Record<string, { name: string; ciro: number; platform: number; acenta: number; count: number }> = {}
    periodActive.forEach(b => {
      if (!b.tenants) return
      const { id, name } = b.tenants
      if (!map[id]) map[id] = { name, ciro: 0, platform: 0, acenta: 0, count: 0 }
      map[id].ciro += b.total_price
      map[id].platform += b.platform_commission
      map[id].acenta += b.agency_commission
      map[id].count += 1
    })
    return Object.values(map).sort((a, b) => b.ciro - a.ciro)
  }, [periodActive])

  // --- Ürün tipi dağılımı (pasta) ---
  const productTypeData = useMemo(() => {
    const map: Record<string, number> = {}
    periodActive.forEach(b => {
      const t = b.metadata?.product_type ?? 'other'
      map[t] = (map[t] ?? 0) + b.total_price
    })
    return Object.entries(map).map(([type, value]) => ({
      name: PRODUCT_TYPE_LABELS[type] ?? type,
      value: Math.round(value),
    }))
  }, [periodActive])

  // --- Durum dağılımı (pasta) ---
  const statusData = useMemo(() => {
    const map: Record<string, number> = {}
    periodAll.forEach(b => { map[b.status] = (map[b.status] ?? 0) + 1 })
    return Object.entries(map).map(([status, count]) => ({
      name: { pending: 'Bekliyor', confirmed: 'Onaylı', cancelled: 'İptal', completed: 'Tamamlandı' }[status] ?? status,
      value: count,
    }))
  }, [periodAll])

  const STATUS_PIE_COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6']

  if (loading) {
    return <div className="p-8 text-slate-400 text-sm">Yükleniyor...</div>
  }

  return (
    <div className="p-8 space-y-8">
      {/* Başlık + dönem seçici */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Raporlar</h1>
          <p className="text-slate-500 text-sm mt-1">Platform geneli gelir ve komisyon analizleri</p>
        </div>

        <div className="relative">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value as Period)}
            className="border rounded-lg pl-4 pr-9 py-2 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* KPI kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Ciro',          value: formatCurrency(totalRevenue),      icon: TrendingUp,  color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Platform Komisyonu',   value: formatCurrency(totalPlatformComm), icon: Layers,      color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Acenta Komisyonları',  value: formatCurrency(totalAgencyComm),   icon: Building2,   color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Rezervasyon',          value: `${periodActive.length} adet`,     icon: BookOpen,    color: 'text-blue-600',   bg: 'bg-blue-50' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white border rounded-xl p-4 flex items-start gap-3">
              <div className={`${s.bg} p-2 rounded-lg`}>
                <Icon size={18} className={s.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-900 mt-0.5">{s.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Zaman serisi — ciro */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-5">Dönemsel Gelir</h2>
        {timelineData.every(d => d.ciro === 0) ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Bu dönemde veri yok</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={timelineData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${(v/1000).toFixed(0)}k`} width={50} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="ciro" name="Toplam Ciro" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="platform" name="Platform Kom." fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="acenta" name="Acenta Kom." fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Rezervasyon trendi */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-5">Rezervasyon Trendi</h2>
        {timelineData.every(d => d.rezervasyon === 0) ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Bu dönemde veri yok</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timelineData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="tarih" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Line
                type="monotone" dataKey="rezervasyon" name="Rezervasyon"
                stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Acenta bazlı gelir + pasta grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Acenta gelir tablosu */}
        <div className="lg:col-span-2 bg-white border rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Acenta Bazlı Gelir</h2>
          {agencyData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">Bu dönemde veri yok</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={agencyData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={v => `₺${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#475569' }} tickLine={false} axisLine={false} width={90} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="ciro" name="Ciro" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {agencyData.map((_, i) => (
                      <Cell key={i} fill={AGENCY_COLORS[i % AGENCY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Tablo */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-2 font-medium text-slate-500 text-xs">Acenta</th>
                      <th className="text-right pb-2 font-medium text-slate-500 text-xs">Rezervasyon</th>
                      <th className="text-right pb-2 font-medium text-slate-500 text-xs">Ciro</th>
                      <th className="text-right pb-2 font-medium text-slate-500 text-xs">Plt. Kom.</th>
                      <th className="text-right pb-2 font-medium text-slate-500 text-xs">Aca. Kom.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {agencyData.map((a, i) => (
                      <tr key={a.name} className="hover:bg-slate-50">
                        <td className="py-2 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: AGENCY_COLORS[i % AGENCY_COLORS.length] }} />
                          <span className="font-medium text-slate-800">{a.name}</span>
                        </td>
                        <td className="py-2 text-right text-slate-600">{a.count}</td>
                        <td className="py-2 text-right font-semibold text-slate-900">{formatCurrency(a.ciro)}</td>
                        <td className="py-2 text-right text-orange-600">{formatCurrency(a.platform)}</td>
                        <td className="py-2 text-right text-green-600">{formatCurrency(a.acenta)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Sağ kolon: iki pasta grafik */}
        <div className="space-y-6">
          {/* Ürün tipi */}
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Ürün Tipi Dağılımı</h2>
            {productTypeData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">Veri yok</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={productTypeData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {productTypeData.map((_, i) => (
                        <Cell key={i} fill={AGENCY_COLORS[i % AGENCY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {productTypeData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: AGENCY_COLORS[i % AGENCY_COLORS.length] }} />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="font-medium text-slate-800">{formatCurrency(d.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Durum dağılımı */}
          <div className="bg-white border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-800 mb-4">Durum Dağılımı</h2>
            {statusData.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">Veri yok</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={55} paddingAngle={3} dataKey="value">
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1.5">
                  {statusData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length] }} />
                        <span className="text-slate-600">{d.name}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{d.value} adet</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
