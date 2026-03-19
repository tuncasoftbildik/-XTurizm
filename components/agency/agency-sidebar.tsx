'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Package, BookOpen, Percent, Settings, Users } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/panel/dashboard', icon: LayoutDashboard },
  { label: 'Ürünler', href: '/panel/products', icon: Package },
  { label: 'Rezervasyonlar', href: '/panel/bookings', icon: BookOpen },
  { label: 'Komisyonlarım', href: '/panel/commissions', icon: Percent },
  { label: 'Müşteriler', href: '/panel/customers', icon: Users },
  { label: 'Ayarlar', href: '/panel/settings', icon: Settings },
]

interface AgencySidebarProps {
  tenantName?: string
  accentColor?: string
  logoUrl?: string | null
}

export function AgencySidebar({ tenantName = 'Acenta', accentColor = '#10b981', logoUrl }: AgencySidebarProps) {
  const pathname = usePathname()
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-4 py-4 border-b border-slate-700">
        {logoUrl ? (
          <Image src={logoUrl} alt={tenantName} width={140} height={70} className="object-contain" />
        ) : (
          <Image src="/logo.png" alt="XTurizm" width={150} height={100} className="object-contain" />
        )}
        <div className="text-xs mt-2 truncate font-medium" style={{ color: accentColor }}>{tenantName}</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">XTurizm v0.1</div>
    </aside>
  )
}
