import Link from 'next/link'
import Image from 'next/image'

export default function StorefrontHome() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex flex-col items-center justify-center text-white px-4">
      <div className="text-center space-y-6 max-w-2xl">
        <div className="flex justify-center">
          <Image src="/logo.png" alt="XTurizm" width={300} height={200} style={{ height: "auto" }} className="object-contain drop-shadow-lg" priority />
        </div>
        <p className="text-xl text-blue-200">
          Türkiye'nin B2B2C Turizm Platformu
        </p>
        <p className="text-blue-300 text-sm">
          Yüzlerce tur, otel ve uçuş — tek platformda. Acentanızla rezervasyon yapın.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            href="/search"
            className="bg-white text-blue-900 font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            Ürünleri Keşfet
          </Link>
          <Link
            href="/admin/dashboard"
            className="border border-white/40 text-white px-8 py-3 rounded-lg hover:bg-white/10 transition text-sm"
          >
            Platform Admin →
          </Link>
          <Link
            href="/panel/dashboard"
            className="border border-white/40 text-white px-8 py-3 rounded-lg hover:bg-white/10 transition text-sm"
          >
            Acenta Paneli →
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-6 text-blue-400 text-xs">
        XTurizm Platform — v0.1 (geliştirme aşaması)
      </footer>
    </main>
  )
}
