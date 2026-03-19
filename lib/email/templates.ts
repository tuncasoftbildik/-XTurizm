/**
 * Email Şablonları — Türkçe HTML templates
 */

function layout(content: string): string {
  return `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#fff;">
    <div style="background:#0f172a;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">XTurizm</h1>
    </div>
    <div style="padding:32px 24px;">
      ${content}
    </div>
    <div style="background:#f8fafc;padding:16px 24px;text-align:center;color:#94a3b8;font-size:12px;">
      © ${new Date().getFullYear()} XTurizm Platform — Bu otomatik bir bildirimdir.
    </div>
  </div>
</body>
</html>`
}

// =============================================
// Rezervasyon — Müşteriye Onay
// =============================================
export function bookingConfirmationEmail(data: {
  bookingRef: string
  customerName: string
  productTitle: string
  totalPrice: string
  currency: string
  notes?: string
  appUrl?: string
}): { subject: string; html: string } {
  const base = data.appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://xturizm.com'
  const portalUrl = `${base}/my-booking/${data.bookingRef}`
  const receiptUrl = `${base}/receipt/${data.bookingRef}`

  return {
    subject: `Rezervasyon Onayı — ${data.bookingRef}`,
    html: layout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Rezervasyonunuz Onaylandı</h2>
      <p style="color:#475569;">Sayın <strong>${data.customerName}</strong>,</p>
      <p style="color:#475569;">Rezervasyonunuz başarıyla oluşturulmuştur. Detaylar aşağıdadır:</p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 0;color:#64748b;">Rezervasyon No</td>
          <td style="padding:12px 0;font-weight:bold;color:#0f172a;text-align:right;">${data.bookingRef}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 0;color:#64748b;">Ürün</td>
          <td style="padding:12px 0;color:#0f172a;text-align:right;">${data.productTitle}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 0;color:#64748b;">Toplam Tutar</td>
          <td style="padding:12px 0;font-weight:bold;color:#16a34a;text-align:right;">${data.totalPrice}</td>
        </tr>
        ${data.notes ? `
        <tr>
          <td style="padding:12px 0;color:#64748b;">Notlar</td>
          <td style="padding:12px 0;color:#0f172a;text-align:right;">${data.notes}</td>
        </tr>` : ''}
      </table>

      <div style="text-align:center;margin:32px 0;display:flex;gap:12px;justify-content:center;">
        <a href="${portalUrl}" style="background:#0f172a;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;margin:4px;">
          Rezervasyonumu Görüntüle
        </a>
        <a href="${receiptUrl}" style="background:#f1f5f9;color:#0f172a;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;margin:4px;border:1px solid #e2e8f0;">
          Makbuzu İndir
        </a>
      </div>

      <p style="color:#475569;font-size:13px;text-align:center;">Sorularınız için bizimle iletişime geçebilirsiniz.</p>
    `),
  }
}

// =============================================
// Rezervasyon — Acentaya Bildirim
// =============================================
export function bookingNotificationEmail(data: {
  bookingRef: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  productTitle: string
  totalPrice: string
  agencyCommission: string
}): { subject: string; html: string } {
  return {
    subject: `Yeni Rezervasyon — ${data.bookingRef}`,
    html: layout(`
      <h2 style="color:#0f172a;margin:0 0 16px;">Yeni Rezervasyon Bildirimi</h2>
      <p style="color:#475569;">Yeni bir rezervasyon oluşturuldu:</p>

      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 0;color:#64748b;">Rezervasyon No</td>
          <td style="padding:12px 0;font-weight:bold;color:#0f172a;text-align:right;">${data.bookingRef}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 0;color:#64748b;">Müşteri</td>
          <td style="padding:12px 0;color:#0f172a;text-align:right;">${data.customerName}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 0;color:#64748b;">E-posta</td>
          <td style="padding:12px 0;color:#0f172a;text-align:right;">${data.customerEmail}</td>
        </tr>
        ${data.customerPhone ? `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 0;color:#64748b;">Telefon</td>
          <td style="padding:12px 0;color:#0f172a;text-align:right;">${data.customerPhone}</td>
        </tr>` : ''}
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 0;color:#64748b;">Ürün</td>
          <td style="padding:12px 0;color:#0f172a;text-align:right;">${data.productTitle}</td>
        </tr>
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:12px 0;color:#64748b;">Toplam Tutar</td>
          <td style="padding:12px 0;font-weight:bold;color:#0f172a;text-align:right;">${data.totalPrice}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;color:#64748b;">Acenta Komisyonu</td>
          <td style="padding:12px 0;font-weight:bold;color:#16a34a;text-align:right;">${data.agencyCommission}</td>
        </tr>
      </table>

      <p style="color:#475569;">Detaylar için acenta panelinize giriş yapabilirsiniz.</p>
    `),
  }
}

// =============================================
// Acenta Onay/Red Bildirimi
// =============================================
export function agencyStatusEmail(data: {
  agencyName: string
  status: 'active' | 'suspended'
  contactEmail: string
  loginUrl?: string
}): { subject: string; html: string } {
  const isApproved = data.status === 'active'

  return {
    subject: isApproved
      ? `Acenta Başvurunuz Onaylandı — ${data.agencyName}`
      : `Acenta Durumu Güncellendi — ${data.agencyName}`,
    html: layout(
      isApproved
        ? `
      <h2 style="color:#16a34a;margin:0 0 16px;">Acentanız Onaylandı!</h2>
      <p style="color:#475569;">Sayın yetkili,</p>
      <p style="color:#475569;"><strong>${data.agencyName}</strong> acentanız XTurizm platformunda aktif edilmiştir.</p>
      <p style="color:#475569;">Artık acenta panelinize giriş yaparak ürün satışına başlayabilirsiniz.</p>

      ${data.loginUrl ? `
      <div style="text-align:center;margin:32px 0;">
        <a href="${data.loginUrl}" style="background:#0f172a;color:#fff;padding:12px 32px;text-decoration:none;border-radius:8px;font-weight:bold;">
          Panele Giriş Yap
        </a>
      </div>` : ''}

      <p style="color:#475569;">XTurizm platformuna hoş geldiniz!</p>
    `
        : `
      <h2 style="color:#ef4444;margin:0 0 16px;">Acenta Durumu Güncellendi</h2>
      <p style="color:#475569;">Sayın yetkili,</p>
      <p style="color:#475569;"><strong>${data.agencyName}</strong> acentanızın durumu <strong>askıya alınmıştır</strong>.</p>
      <p style="color:#475569;">Detaylı bilgi için platform yönetimiyle iletişime geçebilirsiniz.</p>
    `
    ),
  }
}
