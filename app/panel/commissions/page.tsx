'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ToggleRight, ToggleLeft, Info, Calculator } from 'lucide-react'
import { calculatePrice, formatCurrency } from '@/lib/commission/engine'

interface Rule {
  id: string
  name: string
  product_type: string | null
  commission_type: 'percentage' | 'fixed'
  value: number
  min_amount: number | null
  max_amount: number | null
  is_active: boolean
  priority: number
}

const productTypes = [
  { value: '',         label: 'Tüm ürün tipleri (Genel)' },
  { value: 'tour',     label: 'Tur' },
  { value: 'hotel',    label: 'Otel' },
  { value: 'flight',   label: 'Uçuş' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'package',  label: 'Paket' },
]

const examplePrices: Record<string, number> = {
  '': 10000, tour: 8500, hotel: 4800, flight: 1250, transfer: 800, package: 15000
}

export default function AgencyCommissions() {
  const [platformRules, setPlatformRules] = useState<Rule[]>([])
  const [agencyRules, setAgencyRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [calcType, setCalcType] = useState('')

  const [form, setForm] = useState({
    name: '',
    product_type: '',
    commission_type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    min_amount: '',
    max_amount: '',
  })

  const fetchRules = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/panel/commissions')
    const data = await res.json()
    setPlatformRules(data.platformRules ?? [])
    setAgencyRules(data.agencyRules ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchRules() }, [fetchRules])

  function openNew() {
    setEditingRule(null)
    setForm({ name: '', product_type: '', commission_type: 'percentage', value: '', min_amount: '', max_amount: '' })
    setShowForm(true)
  }

  function openEdit(rule: Rule) {
    setEditingRule(rule)
    setForm({
      name: rule.name,
      product_type: rule.product_type ?? '',
      commission_type: rule.commission_type,
      value: String(rule.value),
      min_amount: rule.min_amount != null ? String(rule.min_amount) : '',
      max_amount: rule.max_amount != null ? String(rule.max_amount) : '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.value) { toast.error('Değer zorunludur'); return }

    const url = editingRule ? `/api/panel/commissions/${editingRule.id}` : '/api/panel/commissions'
    const method = editingRule ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) { toast.error(data.error); return }
    toast.success(editingRule ? 'Kural güncellendi' : 'Kural eklendi')
    setShowForm(false)
    fetchRules()
  }

  async function toggleRule(rule: Rule) {
    const res = await fetch(`/api/panel/commissions/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
    })
    if (res.ok) { fetchRules(); toast.success(rule.is_active ? 'Kural devre dışı' : 'Kural aktif') }
  }

  async function deleteRule(id: string) {
    if (!confirm('Bu kuralı silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/panel/commissions/${id}`, { method: 'DELETE' })
    if (res.ok) { fetchRules(); toast.success('Kural silindi') }
  }

  // Hesaplayıcı için örnek fiyat
  const exampleBase = examplePrices[calcType] ?? 10000
  const platformCommission = platformRules
    .filter(r => r.is_active && (!r.product_type || r.product_type === calcType))
    .reduce((sum, r) => {
      const c = r.commission_type === 'percentage' ? (exampleBase * r.value) / 100 : r.value
      return sum + c
    }, 0)

  const agencyCommission = agencyRules
    .filter(r => r.is_active && (!r.product_type || r.product_type === calcType))
    .reduce((sum, r) => {
      const base = exampleBase + platformCommission
      const c = r.commission_type === 'percentage' ? (base * r.value) / 100 : r.value
      return sum + c
    }, 0)

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Komisyon Ayarlarım</h1>
        <p className="text-slate-500 text-sm mt-1">
          Platform komisyonunun üzerine kendi komisyonunuzu ekleyin.
        </p>
      </div>

      {/* Platform Komisyonu — salt okunur */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
          <div className="space-y-2 flex-1">
            <p className="text-sm font-semibold text-blue-800">Platform Komisyonları (Değiştirilemez)</p>
            {loading ? (
              <p className="text-sm text-blue-600">Yükleniyor...</p>
            ) : platformRules.length === 0 ? (
              <p className="text-sm text-blue-600">Platform komisyonu tanımlı değil.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {platformRules.map(r => (
                  <span key={r.id} className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full">
                    {r.product_type ? productTypes.find(p => p.value === r.product_type)?.label + ': ' : 'Genel: '}
                    {r.commission_type === 'percentage' ? `%${r.value}` : `₺${r.value}`}
                    {r.min_amount ? ` (min ₺${r.min_amount})` : ''}
                    {r.max_amount ? ` (max ₺${r.max_amount})` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acenta Komisyon Kuralları */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Benim Komisyon Kurallarım</h2>
            <p className="text-xs text-slate-500 mt-0.5">Ürün tipine göre farklı oranlar tanımlayabilirsiniz.</p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            <Plus size={15} /> Kural Ekle
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800">
              {editingRule ? 'Kuralı Düzenle' : 'Yeni Kural'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Ürün Tipi</label>
                  <select
                    value={form.product_type}
                    onChange={e => setForm(f => ({ ...f, product_type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    {productTypes.map(pt => (
                      <option key={pt.value} value={pt.value}>{pt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Kural Adı (opsiyonel)</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Otomatik oluşturulur"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Komisyon Tipi</label>
                  <select
                    value={form.commission_type}
                    onChange={e => setForm(f => ({ ...f, commission_type: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  >
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixed">Sabit (₺)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Değer {form.commission_type === 'percentage' ? '(%)' : '(₺)'}
                  </label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.value}
                    onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                    required
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={form.commission_type === 'percentage' ? '5' : '200'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Min (₺)</label>
                    <input type="number" min="0" value={form.min_amount} onChange={e => setForm(f => ({ ...f, min_amount: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="—" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Max (₺)</label>
                    <input type="number" min="0" value={form.max_amount} onChange={e => setForm(f => ({ ...f, max_amount: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="—" />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 transition">İptal</button>
                <button type="submit" className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 transition">
                  {editingRule ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Kural listesi */}
        <div className="bg-white border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-slate-400 text-sm">Yükleniyor...</div>
          ) : agencyRules.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-slate-400 text-sm">Henüz komisyon kuralı yok.</p>
              <button onClick={openNew} className="mt-2 text-green-600 text-sm hover:underline">İlk kuralı ekle →</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Kural</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Ürün Tipi</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Komisyon</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Min / Max</th>
                  <th className="text-left px-5 py-3 font-medium text-slate-600">Durum</th>
                  <th className="text-right px-5 py-3 font-medium text-slate-600">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {agencyRules.map(rule => (
                  <tr key={rule.id} className={`hover:bg-slate-50 transition-colors ${!rule.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{rule.name}</td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {productTypes.find(p => p.value === (rule.product_type ?? ''))?.label ?? 'Genel'}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-green-700">
                      {rule.commission_type === 'percentage' ? `%${rule.value}` : `₺${rule.value}`}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {rule.min_amount ? `min ₺${rule.min_amount}` : '—'}
                      {rule.min_amount && rule.max_amount ? ' · ' : ''}
                      {rule.max_amount ? `max ₺${rule.max_amount}` : ''}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${rule.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {rule.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => toggleRule(rule)} className="text-slate-400 hover:text-slate-700 transition">
                          {rule.is_active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                        </button>
                        <button onClick={() => openEdit(rule)} className="text-slate-400 hover:text-blue-600 transition">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => deleteRule(rule.id)} className="text-slate-400 hover:text-red-600 transition">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Fiyat Hesaplayıcı */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Calculator size={18} className="text-slate-500" />
          <h2 className="text-base font-semibold text-slate-800">Fiyat Hesaplayıcı</h2>
        </div>
        <p className="text-xs text-slate-500">Mevcut kurallarla örnek fiyat hesaplaması yapın.</p>

        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-700 font-medium whitespace-nowrap">Ürün tipi:</label>
          <select
            value={calcType}
            onChange={e => setCalcType(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {productTypes.map(pt => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">Örnek fiyat: {formatCurrency(exampleBase)}</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm max-w-sm">
          <div className="flex justify-between text-slate-500">
            <span>Sağlayıcı fiyatı</span>
            <span>{formatCurrency(exampleBase)}</span>
          </div>
          <div className="flex justify-between text-blue-600">
            <span>Platform komisyonu</span>
            <span>+{formatCurrency(platformCommission)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Acenta komisyonum</span>
            <span>+{formatCurrency(agencyCommission)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-slate-900">
            <span>Müşteri satış fiyatı</span>
            <span>{formatCurrency(exampleBase + platformCommission + agencyCommission)}</span>
          </div>
          {exampleBase > 0 && (
            <div className="text-xs text-slate-400 pt-1">
              Toplam marj: %{(((platformCommission + agencyCommission) / exampleBase) * 100).toFixed(1)}
              {' '}· Kazancım: {formatCurrency(agencyCommission)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
