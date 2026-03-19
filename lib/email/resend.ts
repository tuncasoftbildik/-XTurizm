/**
 * Email gönderim servisi — Resend API
 */

import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = process.env.EMAIL_FROM || 'XTurizm <noreply@xturizm.com>'

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend()
    if (!resend) {
      console.warn('[Email] RESEND_API_KEY tanımlı değil, email gönderilmedi.')
      return { success: false, error: 'API key eksik' }
    }

    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })

    if (error) {
      console.error('[Email] Gönderilemedi:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[Email] Hata:', err)
    return { success: false, error: String(err) }
  }
}
