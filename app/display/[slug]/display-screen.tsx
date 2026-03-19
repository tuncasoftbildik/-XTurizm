'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/commission/engine'
import { Plane, Hotel, MapPin, Package, ChevronLeft, ChevronRight, Maximize, Minimize, Clock } from 'lucide-react'

interface Product {
  externalId: string
  type: 'tour' | 'hotel' | 'flight' | 'transfer' | 'package'
  title: string
  description: string
  price: number
  currency: string
  metadata: Record<string, unknown>
  availableFrom?: string
  availableTo?: string
}

interface Tenant {
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
}

const TYPE_CONFIG = {
  tour:     { label: 'Tur',      Icon: MapPin,    bg: 'from-orange-500 to-amber-400' },
  hotel:    { label: 'Otel',     Icon: Hotel,     bg: 'from-blue-600 to-cyan-500' },
  flight:   { label: 'Uçuş',    Icon: Plane,     bg: 'from-sky-500 to-blue-400' },
  transfer: { label: 'Transfer', Icon: MapPin,    bg: 'from-green-500 to-teal-400' },
  package:  { label: 'Paket',   Icon: Package,   bg: 'from-purple-600 to-violet-500' },
}

const ALL_TYPES = ['tour', 'hotel', 'flight', 'transfer', 'package'] as const
type ProductType = typeof ALL_TYPES[number]

function useNow() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return now
}

export function DisplayScreen({ slug }: { slug: string }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [activeType, setActiveType] = useState<ProductType | 'all'>('all')
  const [activeIndex, setActiveIndex] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const now = useNow()

  useEffect(() => {
    fetch(`/api/display/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return }
        setTenant(d.tenant)
        setProducts(d.products)
      })
      .catch(() => setError('Veriler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [slug])

  const filtered = products.filter(p => activeType === 'all' || p.type === activeType)

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (filtered.length <= 1) return
    const t = setInterval(() => {
      setActiveIndex(i => (i + 1) % filtered.length)
    }, 5000)
    return () => clearInterval(t)
  }, [filtered.length])

  // Reset index on type change
  useEffect(() => { setActiveIndex(0) }, [activeType])

  const prev = useCallback(() => {
    setActiveIndex(i => (i - 1 + filtered.length) % filtered.length)
  }, [filtered.length])

  const next = useCallback(() => {
    setActiveIndex(i => (i + 1) % filtered.length)
  }, [filtered.length])

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const primaryColor = tenant?.primary_color ?? '#1e40af'
  const secondaryColor = tenant?.secondary_color ?? '#3b82f6'

  const availableTypes = ALL_TYPES.filter(t => products.some(p => p.type === t))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
        <div className="text-white text-xl font-medium animate-pulse">Yükleniyor...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center text-white">
          <p className="text-6xl mb-4">✈️</p>
          <p className="text-xl font-medium">{error}</p>
        </div>
      </div>
    )
  }

  const activeProduct = filtered[activeIndex]

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col select-none"
      style={{ background: `linear-gradient(135deg, ${primaryColor}ee, ${secondaryColor}cc, #0f172a)` }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          {tenant?.logo_url ? (
            <Image src={tenant.logo_url} alt={tenant.name} width={120} height={60} style={{ height: 'auto' }} className="object-contain" />
          ) : (
            <Image src="/logo.png" alt="XTurizm" width={120} height={80} style={{ height: 'auto' }} className="object-contain" loading="eager" />
          )}
        </div>

        {/* Saat */}
        <div className="text-center">
          <div className="text-3xl font-bold text-white tabular-nums tracking-widest">
            {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-white/60 text-sm mt-0.5">
            {now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Sağ: tam ekran + acenta adı */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-white font-semibold">{tenant?.name}</div>
            <div className="text-white/50 text-xs flex items-center justify-end gap-1"><Clock size={11} /> Güncel fiyatlar</div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition"
            title="Tam Ekran"
          >
            {fullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </header>

      {/* Kategori sekmeleri */}
      <div className="flex items-center gap-3 px-8 py-3 overflow-x-auto">
        <button
          onClick={() => setActiveType('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
            activeType === 'all' ? 'bg-white text-slate-900' : 'bg-white/15 text-white hover:bg-white/25'
          }`}
        >
          Tümü ({products.length})
        </button>
        {availableTypes.map(t => {
          const cfg = TYPE_CONFIG[t]
          const count = products.filter(p => p.type === t).length
          return (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${
                activeType === t ? 'bg-white text-slate-900' : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <cfg.Icon size={14} /> {cfg.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Ana içerik */}
      <div className="flex-1 flex gap-6 px-8 pb-6 min-h-0">

        {/* Öne çıkan ürün (büyük) */}
        {activeProduct && (
          <div className="flex-1 flex flex-col justify-between bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 relative overflow-hidden">
            {/* Arkaplan renk bloğu */}
            <div className={`absolute top-0 right-0 w-48 h-48 rounded-full bg-gradient-to-br ${TYPE_CONFIG[activeProduct.type]?.bg ?? 'from-blue-500 to-blue-400'} opacity-20 blur-2xl`} />

            <div className="relative z-10">
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${TYPE_CONFIG[activeProduct.type]?.bg ?? 'from-blue-500 to-blue-400'} text-white text-sm font-medium mb-6`}>
                {(() => { const cfg = TYPE_CONFIG[activeProduct.type]; return cfg ? <cfg.Icon size={14} /> : null })()}
                {TYPE_CONFIG[activeProduct.type]?.label ?? activeProduct.type}
              </div>

              <h2 className="text-4xl font-bold text-white leading-tight mb-4">{activeProduct.title}</h2>
              <p className="text-white/70 text-lg leading-relaxed mb-6">{activeProduct.description}</p>

              {activeProduct.metadata && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {!!activeProduct.metadata.destination && (
                    <span className="bg-white/15 text-white/80 text-sm px-3 py-1 rounded-full">📍 {String(activeProduct.metadata.destination)}</span>
                  )}
                  {!!activeProduct.metadata.duration && (
                    <span className="bg-white/15 text-white/80 text-sm px-3 py-1 rounded-full">⏱ {String(activeProduct.metadata.duration)} gün</span>
                  )}
                  {!!activeProduct.metadata.stars && (
                    <span className="bg-white/15 text-white/80 text-sm px-3 py-1 rounded-full">⭐ {String(activeProduct.metadata.stars)} yıldız</span>
                  )}
                  {!!activeProduct.metadata.airline && (
                    <span className="bg-white/15 text-white/80 text-sm px-3 py-1 rounded-full">✈️ {String(activeProduct.metadata.airline)}</span>
                  )}
                  {Array.isArray(activeProduct.metadata.includes) && (activeProduct.metadata.includes as string[]).map((inc: string) => (
                    <span key={inc} className="bg-white/15 text-white/80 text-sm px-3 py-1 rounded-full">✓ {inc}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="relative z-10 flex items-end justify-between">
              <div>
                <p className="text-white/50 text-sm mb-1">Kişi başı fiyat</p>
                <p className="text-5xl font-black text-white">{formatCurrency(activeProduct.price, activeProduct.currency)}</p>
                {activeProduct.availableTo && (
                  <p className="text-white/40 text-xs mt-2">
                    Son tarih: {new Date(activeProduct.availableTo).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>

              <div className="text-center bg-white/15 rounded-xl px-6 py-4 border border-white/20">
                <p className="text-white/60 text-xs mb-1">Rezervasyon</p>
                <p className="text-white font-bold text-sm">İletişime Geçin</p>
              </div>
            </div>

            {/* Gezinme okları */}
            {filtered.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                <button onClick={prev} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition">
                  <ChevronLeft size={20} />
                </button>
                <div className="flex gap-1.5">
                  {filtered.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`rounded-full transition-all ${i === activeIndex ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
                    />
                  ))}
                </div>
                <button onClick={next} className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition">
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sağ: küçük ürün listesi */}
        <div className="w-72 flex flex-col gap-3 overflow-y-auto">
          {filtered.map((p, i) => {
            const cfg = TYPE_CONFIG[p.type]
            const Icon = cfg?.Icon ?? MapPin
            const isActive = i === activeIndex
            return (
              <button
                key={p.externalId}
                onClick={() => setActiveIndex(i)}
                className={`w-full text-left rounded-xl p-4 border transition-all ${
                  isActive
                    ? 'bg-white/25 border-white/40 shadow-lg scale-[1.02]'
                    : 'bg-white/10 border-white/10 hover:bg-white/15'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${cfg?.bg ?? 'from-blue-500 to-blue-400'} flex-shrink-0`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{p.title}</p>
                    <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{p.description}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-white/50 text-xs">{cfg?.label}</span>
                  <span className="text-white font-bold text-sm">{formatCurrency(p.price, p.currency)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-3 bg-black/20 border-t border-white/10 flex items-center justify-between">
        <p className="text-white/40 text-xs">Fiyatlar KDV dahil olup değişebilir. Kesin fiyat için iletişime geçiniz.</p>
        <p className="text-white/40 text-xs">Powered by XTurizm</p>
      </footer>
    </div>
  )
}
