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
- **Backend:** Supabase (Auth, PostgreSQL, RLS)
- **Email:** Resend API
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
| Komisyon ayar sayfası | ✅ |
| B2C Arama sayfası | ✅ |
| Acenta CRUD (admin) | ✅ |
| Rezervasyon akışı (B2C + Acenta) | ✅ |
| Email bildirim sistemi (Resend) | ✅ |
| White-label özelleştirme | 🔜 |
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
SUPABASE_SERVICE_ROLE_KEY=
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
                                                        Email: Rezervasyon onayı
```

### Acenta Paneli
```
Ürün Kataloğu (/panel/products) → Booking Modal → Onay
                                                     ↓
                                          Email: Müşteriye onay + Acentaya bildirim
```

## Komisyon Akışı

```
Sağlayıcı Fiyatı
  + Platform Komisyonu (%10 varsayılan)
  + Acenta Komisyonu (acenta tarafından belirlenir)
  = Müşteriye Gösterilen Fiyat
```

## Email Bildirimleri

| Olay | Alıcı | Açıklama |
|------|-------|----------|
| Yeni rezervasyon | Müşteri | Rezervasyon onay detayları |
| Yeni rezervasyon | Acenta | Müşteri bilgisi + komisyon özeti |
| Acenta onayı | Acenta | Hesap aktif edildi bildirimi |
| Acenta askıya alma | Acenta | Hesap askıya alındı bildirimi |

## Route Yapısı

| URL | Açıklama |
|-----|----------|
| `/` | B2C Storefront |
| `/search` | Ürün arama + rezervasyon |
| `/admin/*` | Platform admin paneli |
| `/panel/*` | Acenta paneli (white-label) |
| `/display/[slug]` | Müşteri vitrin ekranı |

## API Endpoints

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/bookings` | POST | Acenta üzerinden rezervasyon (auth gerekli) |
| `/api/bookings/public` | POST | B2C direkt rezervasyon (auth gereksiz) |
| `/api/admin/agencies` | GET/POST | Acenta listele/oluştur (admin) |
| `/api/admin/agencies/[id]` | PATCH/DELETE | Acenta güncelle/sil (admin) |
| `/api/admin/bookings` | GET | Tüm rezervasyonlar (admin) |
| `/api/admin/bookings/[id]` | PATCH | Rezervasyon durumu güncelle (admin) |
| `/api/panel/bookings` | GET | Acenta rezervasyonları |
| `/api/panel/commissions` | GET/POST | Komisyon kuralları |
| `/api/panel/customers` | GET | Acenta müşterileri |
| `/api/products` | GET | Ürün listesi |

---

*Geliştirme aşamasında — v0.2*
