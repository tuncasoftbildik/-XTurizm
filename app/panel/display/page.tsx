'use client'

import { useState, useEffect } from 'react'
import { Monitor, ExternalLink, Copy, Check, Tv, Smartphone, Info } from 'lucide-react'
import { toast } from 'sonner'

interface Tenant {
  slug: string
  name: string
}

export default function AgencyDisplay() {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/panel/settings')
      .then(r => r.json())
      .then((t: Tenant) => setTenant(t))
  }, [])

  const displayUrl = tenant
    ? `${window.location.origin}/display/${tenant.slug}`
    : ''

  function copyUrl() {
    navigator.clipboard.writeText(displayUrl)
    setCopied(true)
    toast.success('Link kopyalandı')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Müşteri Ekranı</h1>
        <p className="text-slate-500 text-sm mt-1">
          Ürünlerinizi müşterilere veya TV'ye tam ekran vitrin olarak gösterin
        </p>
      </div>

      {/* Link kartı */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <Monitor size={18} className="text-blue-600" />
          Vitrin Linkiniz
        </h2>

        <div className="flex gap-2">
          <div className="flex-1 bg-slate-50 border rounded-lg px-4 py-2.5 text-sm font-mono text-slate-700 truncate">
            {displayUrl || 'Yükleniyor...'}
          </div>
          <button
            onClick={copyUrl}
            disabled={!displayUrl}
            className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </button>
          {displayUrl && (
            <a
              href={displayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <ExternalLink size={14} />
              Aç
            </a>
          )}
        </div>
      </div>

      {/* Kullanım senaryoları */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Tv,
            title: 'TV Yayını',
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            steps: [
              'TV\'ye Chrome veya Firefox açın',
              'Linki adres çubuğuna yapıştırın',
              'F11 tuşuna basarak tam ekran yapın',
              'Ürünler otomatik geçiş yapar',
            ],
          },
          {
            icon: Monitor,
            title: 'Ofis Ekranı',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            steps: [
              'Masaüstü bilgisayarda linki açın',
              'F11 veya tam ekran butonuna basın',
              'Müşteri karşısındaki ekranda gösterin',
              'Ürüne tıklayarak öne çıkarabilirsiniz',
            ],
          },
          {
            icon: Smartphone,
            title: 'Müşteri ile Paylaş',
            color: 'text-green-600',
            bg: 'bg-green-50',
            steps: [
              'Linki WhatsApp veya SMS ile gönderin',
              'Müşteri kendi cihazında inceler',
              'Fiyatlar her zaman güncel gösterilir',
              'Acenta komisyonunuz dahil fiyat görünür',
            ],
          },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.title} className="bg-white border rounded-xl p-5">
              <div className={`${s.bg} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
                <Icon size={20} className={s.color} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-3">{s.title}</h3>
              <ol className="space-y-1.5">
                {s.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="bg-slate-100 text-slate-500 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )
        })}
      </div>

      {/* Bilgi notu */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Info size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800 space-y-1">
          <p className="font-medium">Önemli Notlar</p>
          <ul className="space-y-0.5 text-amber-700">
            <li>• Vitrin sayfasında müşteriler yalnızca <strong>son satış fiyatını</strong> görür — maliyet ve komisyon gizlidir.</li>
            <li>• Fiyatlar komisyon ayarlarınızı yansıtır; ayarlardan değiştirildiğinde vitrin otomatik güncellenir.</li>
            <li>• Vitrin linki herkese açıktır, şifre gerekmez.</li>
          </ul>
        </div>
      </div>

      {/* Gerekli SQL notu (geliştirici için) */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-400 font-mono">
        <p className="font-semibold text-slate-500 mb-2 font-sans text-sm">Supabase SQL (bir kez çalıştırın):</p>
        <pre className="whitespace-pre-wrap break-all">{`-- Vitrin sayfası için public okuma izinleri
CREATE POLICY "display_tenant_read" ON tenants
  FOR SELECT TO anon USING (status = 'active');

CREATE POLICY "display_platform_rules" ON commission_rules
  FOR SELECT TO anon USING (tenant_id IS NULL AND is_active = true);

CREATE POLICY "display_agency_rules" ON commission_rules
  FOR SELECT TO anon USING (is_active = true);`}</pre>
      </div>
    </div>
  )
}
