'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

interface Tenant { id: string; name: string; slug: string }
interface Provider { id: string; name: string; type: string }

interface Rule {
  id: string
  name: string
  tenant_id: string | null
  provider_id: string | null
  product_type: string | null
  commission_type: 'percentage' | 'fixed'
  value: number
  min_amount: number | null
  max_amount: number | null
  priority: number
  is_active: boolean
}

interface Props {
  open: boolean
  rule?: Rule | null
  tenants: Tenant[]
  providers: Provider[]
  onClose: () => void
  onSaved: () => void
}

const productTypes = [
  { value: '', label: 'Tüm ürün tipleri' },
  { value: 'tour', label: 'Tur' },
  { value: 'hotel', label: 'Otel' },
  { value: 'flight', label: 'Uçuş' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'package', label: 'Paket' },
]

export function CommissionFormModal({ open, rule, tenants, providers, onClose, onSaved }: Props) {
  const isEdit = !!rule
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    tenant_id: '',
    provider_id: '',
    product_type: '',
    commission_type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_amount: '',
    max_amount: '',
    priority: '0',
  })

  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name,
        tenant_id: rule.tenant_id ?? '',
        provider_id: rule.provider_id ?? '',
        product_type: rule.product_type ?? '',
        commission_type: rule.commission_type,
        value: String(rule.value),
        min_amount: rule.min_amount != null ? String(rule.min_amount) : '',
        max_amount: rule.max_amount != null ? String(rule.max_amount) : '',
        priority: String(rule.priority),
      })
    } else {
      setForm({ name: '', tenant_id: '', provider_id: '', product_type: '', commission_type: 'percentage', value: '', min_amount: '', max_amount: '', priority: '0' })
    }
  }, [rule, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const url = isEdit ? `/api/admin/commissions/${rule.id}` : '/api/admin/commissions'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) { toast.error(data.error); return }

    toast.success(isEdit ? 'Kural güncellendi' : 'Kural oluşturuldu')
    onSaved()
    onClose()
  }

  if (!open) return null

  const isPercent = form.commission_type === 'percentage'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-base font-semibold">{isEdit ? 'Kuralı Düzenle' : 'Yeni Komisyon Kuralı'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Kural adı */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kural Adı *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Platform Default %10"
            />
          </div>

          {/* Kural tipi (platform / acenta) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Acenta <span className="text-slate-400 font-normal">(boş bırakılırsa platform kuralı)</span>
            </label>
            <select
              value={form.tenant_id}
              onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Platform kuralı (tüm acentalara uygulanır)</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.slug})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Sağlayıcı filtresi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sağlayıcı</label>
              <select
                value={form.provider_id}
                onChange={e => setForm(f => ({ ...f, provider_id: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Tüm sağlayıcılar</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Ürün tipi filtresi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ürün Tipi</label>
              <select
                value={form.product_type}
                onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {productTypes.map(pt => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Komisyon tipi + değer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Komisyon Tipi *</label>
              <select
                value={form.commission_type}
                onChange={e => setForm(f => ({ ...f, commission_type: e.target.value as 'percentage' | 'fixed' }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="percentage">Yüzde (%)</option>
                <option value="fixed">Sabit tutar (₺)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Değer * {isPercent ? '(%)' : '(₺)'}
              </label>
              <input
                type="number"
                min="0"
                step={isPercent ? '0.01' : '1'}
                max={isPercent ? '100' : undefined}
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isPercent ? '10' : '500'}
              />
            </div>
          </div>

          {/* Min/Max */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Komisyon (₺)</label>
              <input
                type="number"
                min="0"
                value={form.min_amount}
                onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yok"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Max Komisyon (₺)</label>
              <input
                type="number"
                min="0"
                value={form.max_amount}
                onChange={e => setForm(f => ({ ...f, max_amount: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Yok"
              />
            </div>
          </div>

          {/* Öncelik */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Öncelik <span className="text-slate-400 font-normal">(yüksek sayı = önce uygulanır)</span>
            </label>
            <input
              type="number"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Özet */}
          {form.value && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
              Bu kural{form.tenant_id ? '' : ' (platform)'}: {form.commission_type === 'percentage' ? `%${form.value} komisyon` : `₺${form.value} sabit komisyon`}
              {form.product_type ? ` — sadece ${productTypes.find(p => p.value === form.product_type)?.label} ürünlere` : ' — tüm ürünlere'} uygulanır.
              {form.min_amount && ` Min: ₺${form.min_amount}.`}
              {form.max_amount && ` Max: ₺${form.max_amount}.`}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 transition">
              İptal
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
