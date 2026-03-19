'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Percent } from 'lucide-react'
import { CommissionFormModal } from '@/components/admin/commission-form-modal'

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
  tenants: { id: string; name: string; slug: string } | null
  providers: { id: string; name: string; type: string } | null
}

interface Tenant { id: string; name: string; slug: string }
interface Provider { id: string; name: string; type: string }

const productTypeLabel: Record<string, string> = {
  tour: 'Tur', hotel: 'Otel', flight: 'Uçuş', transfer: 'Transfer', package: 'Paket'
}

export default function CommissionsPage() {
  const [rules, setRules] = useState<Rule[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<Rule | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [rulesRes, tenantsRes, providersRes] = await Promise.all([
      fetch('/api/admin/commissions'),
      fetch('/api/admin/agencies'),
      fetch('/api/admin/providers'),
    ])
    setRules(await rulesRes.json())
    setTenants(await tenantsRes.json())
    setProviders(await providersRes.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function toggleActive(rule: Rule) {
    const res = await fetch(`/api/admin/commissions/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !rule.is_active }),
    })
    if (res.ok) {
      toast.success(rule.is_active ? 'Kural devre dışı bırakıldı' : 'Kural aktif edildi')
      fetchAll()
    }
  }

  async function deleteRule(id: string) {
    if (!confirm('Bu komisyon kuralını silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/admin/commissions/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Kural silindi'); fetchAll() }
    else toast.error('Silme başarısız')
  }

  // Platform ve acenta kurallarını ayır
  const platformRules = rules.filter(r => !r.tenant_id)
  const agencyRules = rules.filter(r => r.tenant_id)

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Komisyon Kuralları</h1>
          <p className="text-slate-500 text-sm mt-1">Kademeli komisyon yapısını yönetin</p>
        </div>
        <button
          onClick={() => { setEditingRule(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus size={16} /> Yeni Kural
        </button>
      </div>

      {/* Komisyon akış şeması */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Komisyon Akışı</p>
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <div className="bg-white border rounded-lg px-3 py-2 text-center shadow-sm">
            <div className="font-semibold text-slate-700">Sağlayıcı Fiyatı</div>
            <div className="text-xs text-slate-400">base_price</div>
          </div>
          <span className="text-blue-400 font-bold text-lg">+</span>
          <div className="bg-blue-600 text-white rounded-lg px-3 py-2 text-center shadow-sm">
            <div className="font-semibold">Platform Komisyonu</div>
            <div className="text-xs text-blue-200">{platformRules.filter(r => r.is_active).length} aktif kural</div>
          </div>
          <span className="text-blue-400 font-bold text-lg">+</span>
          <div className="bg-green-600 text-white rounded-lg px-3 py-2 text-center shadow-sm">
            <div className="font-semibold">Acenta Komisyonu</div>
            <div className="text-xs text-green-200">{agencyRules.filter(r => r.is_active).length} aktif kural</div>
          </div>
          <span className="text-blue-400 font-bold text-lg">=</span>
          <div className="bg-orange-500 text-white rounded-lg px-3 py-2 text-center shadow-sm">
            <div className="font-semibold">Satış Fiyatı</div>
            <div className="text-xs text-orange-200">Müşteri görür</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Yükleniyor...</div>
      ) : (
        <>
          {/* Platform Kuralları */}
          <RulesTable
            title="Platform Kuralları"
            subtitle="Tüm acentalara ve ürünlere uygulanır"
            rules={platformRules}
            badgeColor="bg-blue-100 text-blue-700"
            onEdit={r => { setEditingRule(r); setModalOpen(true) }}
            onToggle={toggleActive}
            onDelete={deleteRule}
          />

          {/* Acenta Kuralları */}
          <RulesTable
            title="Acenta Kuralları"
            subtitle="Belirli acentalara özel komisyon ekleri"
            rules={agencyRules}
            badgeColor="bg-green-100 text-green-700"
            onEdit={r => { setEditingRule(r); setModalOpen(true) }}
            onToggle={toggleActive}
            onDelete={deleteRule}
          />
        </>
      )}

      <CommissionFormModal
        open={modalOpen}
        rule={editingRule}
        tenants={tenants}
        providers={providers}
        onClose={() => setModalOpen(false)}
        onSaved={fetchAll}
      />
    </div>
  )
}

function RulesTable({
  title, subtitle, rules, badgeColor, onEdit, onToggle, onDelete
}: {
  title: string
  subtitle: string
  rules: Rule[]
  badgeColor: string
  onEdit: (r: Rule) => void
  onToggle: (r: Rule) => void
  onDelete: (id: string) => void
}) {
  return (
    <div>
      <div className="mb-3">
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-8 text-center">
            <Percent size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-400 text-sm">Henüz kural yok.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Kural</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Acenta</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Filtre</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Komisyon</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Öncelik</th>
                <th className="text-left px-5 py-3 font-medium text-slate-600">Durum</th>
                <th className="text-right px-5 py-3 font-medium text-slate-600">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rules.map(rule => (
                <tr key={rule.id} className={`hover:bg-slate-50 transition-colors ${!rule.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5 font-medium text-slate-900">{rule.name}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {rule.tenants ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                        {rule.tenants.name}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Tüm acentalar</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs space-y-0.5">
                    <div>{rule.providers ? rule.providers.name : 'Tüm sağlayıcılar'}</div>
                    <div>{rule.product_type ? productTypeLabel[rule.product_type] : 'Tüm tipler'}</div>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">
                    {rule.commission_type === 'percentage' ? `%${rule.value}` : `₺${rule.value}`}
                    {(rule.min_amount || rule.max_amount) && (
                      <div className="text-xs text-slate-400 font-normal">
                        {rule.min_amount ? `min ₺${rule.min_amount}` : ''}
                        {rule.min_amount && rule.max_amount ? ' · ' : ''}
                        {rule.max_amount ? `max ₺${rule.max_amount}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{rule.priority}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rule.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {rule.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onToggle(rule)} title={rule.is_active ? 'Devre dışı bırak' : 'Aktif et'} className="text-slate-400 hover:text-slate-700 transition">
                        {rule.is_active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                      </button>
                      <button onClick={() => onEdit(rule)} title="Düzenle" className="text-slate-400 hover:text-blue-600 transition">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => onDelete(rule.id)} title="Sil" className="text-slate-400 hover:text-red-600 transition">
                        <Trash2 size={16} />
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
  )
}
