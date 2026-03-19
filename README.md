# XTurizm Platform

B2B2C Turizm Satış Platformu — Multi-tenant, white-label acenta paneli, kademeli komisyon yönetimi ve email bildirim sistemi.

## Mimari

```
Dış Sağlayıcılar → Provider API Layer → Commission Engine
                                              ↓
                    Admin Panel    Agency Panel    B2C Storefront
                    (platform)     (white-label)   (son müşteri)
                                              ↓
                              Email Bildirim Sistemi (Resend)
```

## Tech Stack

- **Framework:** Next.js 16, TypeScript
- **UI:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Auth, PostgreSQL, RLS, Storage)
- **Email:** Resend API
- **Grafikler:** Recharts
- **Routing:** Subdomain-based multi-tenant (`acenta.xturizm.com`)

## Modüller

| Modül | Durum |
|-------|-------|
| Supabase DB şeması | ✅ |
| Commission Engine (kademeli) | ✅ |
| Mock Provider adaptörü | ✅ |
| Subdomain tenant routing | ✅ |
| Auth sistemi (login/logout) | ✅ |
| Admin Dashboard | ✅ |
| Acenta Dashboard | ✅ |
| Ürün Kataloğu + fiyat dökümü | ✅ |
| Komisyon ayar sayfası (admin + acenta) | ✅ |
| B2C Arama sayfası | ✅ |
| Acenta CRUD (admin) | ✅ |
| Acenta Detay Sayfası (admin) | ✅ |
| Rezervasyon akışı (B2C + Acenta) | ✅ |
| Tüm Rezervasyonlar listesi (admin) | ✅ |
| CSV Export (admin + acenta) | ✅ |
| PDF Makbuz (/receipt/[ref]) | ✅ |
| Raporlar sayfası (grafik + istatistik) | ✅ |
| Müşteri listesi (acenta) | ✅ |
| Müşteri Vitrin Ekranı (/display/[slug]) | ✅ |
| Sağlayıcı Yönetimi (admin) | ✅ |
| Email bildirim sistemi (Resend) | ✅ |
| E-postada makbuz + portal linkleri | ✅ |
| Müşteri Portalı (/my-booking/[ref]) | ✅ |
| White-label özelleştirme (logo, renk) | ✅ |
| Ürün Yönetimi (CRUD) | 🔜 |
| Ödeme entegrasyonu | 🔜 |
| Gerçek sağlayıcı API entegrasyonu | 🔜 |

## Kurulum

```bash
git clone https://github.com/tuncasoftbildik/-XTurizm.git
cd -XTurizm
npm install
cp .env.local.example .env.local
# .env.local dosyasını doldur
npm run dev
```

## Ortam Değişkenleri

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ROOT_DOMAIN=xturizm.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=XTurizm <noreply@xturizm.com>
```

## Rezervasyon Akışı

### B2C (Son Müşteri)
```
Ürün Arama (/search) → Ürün Detay Modal → Müşteri Bilgi Formu → Onay
                                                                   ↓
                                         Email: Onay + "Rezervasyonumu Görüntüle" + "Makbuzu İndir"
                                         Müşteri Portalı: /my-booking/[ref]  (e-posta doğrulamalı)
                                         PDF Makbuz: /receipt/[ref]
```

### Acenta Paneli
```
Ürün Kataloğu (/panel/products) → Booking Modal → Onay
                                                     ↓
                                          Email: Müşteriye onay + Acentaya bildirim
                                          PDF Makbuz: /receipt/[ref]
```

## Komisyon Akışı

Platform komisyonu yalnızca admin tarafından görülür. Acenta panelinde "Net fiyat" olarak gösterilir.

```
Sağlayıcı Fiyatı
  + Platform Komisyonu (gizli — sadece admin görür)
  = Net Fiyat (acenta görür)
    + Acenta Komisyonu (acenta tarafından belirlenir)
    = Müşteriye Gösterilen Fiyat
```

## Route Yapısı

| URL | Açıklama |
|-----|----------|
| `/` | B2C Storefront |
| `/search` | Ürün arama + rezervasyon |
| `/admin/*` | Platform admin paneli |
| `/admin/agencies/[id]` | Acenta detay sayfası |
| `/admin/bookings` | Tüm rezervasyonlar |
| `/admin/reports` | Raporlar ve grafikler |
| `/admin/providers` | Sağlayıcı yönetimi |
| `/panel/*` | Acenta paneli (white-label) |
| `/panel/commissions` | Komisyon kuralları |
| `/panel/customers` | Müşteri listesi |
| `/panel/display` | Müşteri vitrin ekranı ayarları |
| `/display/[slug]` | Canlı müşteri vitrin ekranı (TV/ofis) |
| `/receipt/[ref]` | Rezervasyon makbuzu (yazdırılabilir PDF) |
| `/my-booking/[ref]` | Müşteri portalı — e-posta doğrulamalı rezervasyon takibi |

## API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/bookings` | POST | Acenta üzerinden rezervasyon (auth gerekli) |
| `/api/bookings/public` | POST | B2C direkt rezervasyon (auth gereksiz) |
| `/api/products` | GET | Ürün listesi |
| `/api/display/[slug]` | GET | Vitrin verisi (public) |
| `/api/receipt/[ref]` | GET | Makbuz verisi (public) |
| `/api/my-booking/[ref]` | POST `{email}` | Müşteri portalı — e-posta doğrulamalı rezervasyon verisi |
| `/api/admin/agencies` | GET/POST | Acenta listele/oluştur |
| `/api/admin/agencies/[id]` | PATCH/DELETE | Acenta güncelle/sil |
| `/api/admin/agencies/[id]/details` | GET | Acenta detay (KPI + rezervasyonlar) |
| `/api/admin/bookings` | GET | Tüm rezervasyonlar |
| `/api/admin/bookings/[id]` | PATCH | Rezervasyon durumu güncelle |
| `/api/admin/bookings/export` | GET | CSV export |
| `/api/admin/reports` | GET | Rapor verileri |
| `/api/admin/providers` | GET/POST | Sağlayıcı listele/oluştur |
| `/api/admin/providers/[id]` | PATCH/DELETE | Sağlayıcı güncelle/sil |
| `/api/panel/bookings` | GET | Acenta rezervasyonları |
| `/api/panel/bookings/export` | GET | Acenta CSV export |
| `/api/panel/commissions` | GET/POST | Komisyon kuralları |
| `/api/panel/commissions/[id]` | PATCH/DELETE | Komisyon kuralı düzenle/sil |
| `/api/panel/customers` | GET | Acenta müşterileri |
| `/api/panel/settings` | GET/PATCH | Acenta ayarları |

## Email Bildirimleri

| Olay | Alıcı | Açıklama |
|------|-------|----------|
| Yeni rezervasyon | Müşteri | Onay + portal linki + makbuz linki |
| Yeni rezervasyon | Acenta | Müşteri bilgisi + komisyon özeti |
| Acenta onayı | Acenta | Hesap aktif edildi bildirimi |
| Acenta askıya alma | Acenta | Hesap askıya alındı bildirimi |

---

*v0.4 — Geliştirme aşamasında*
