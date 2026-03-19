import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, BookOpen, TrendingUp, Percent } from 'lucide-react'

export default function AgencyDashboard() {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hoş Geldiniz</h1>
        <p className="text-slate-500 text-sm mt-1">Demo Acenta — Acenta paneli özeti</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Aktif Ürün</CardTitle>
            <Package size={20} className="text-blue-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-slate-900">7</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Toplam Rezervasyon</CardTitle>
            <BookOpen size={20} className="text-green-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-slate-900">0</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Bu Ay Gelir</CardTitle>
            <TrendingUp size={20} className="text-orange-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-slate-900">₺0</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Komisyon Oranım</CardTitle>
            <Percent size={20} className="text-purple-600" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-slate-900">%0</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fiyat Yapısı</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600 space-y-2">
          <p>Platform size ürünleri <strong>net fiyat</strong> olarak sunar.</p>
          <p>Siz bu net fiyatın üzerine kendi komisyonunuzu ekleyebilirsiniz.</p>
          <p>Müşteri yalnızca son satış fiyatını görür.</p>
        </CardContent>
      </Card>
    </div>
  )
}
