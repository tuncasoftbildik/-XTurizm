'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Building2, Plug, Percent, BarChart3, Settings } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Acentalar', href: '/admin/agencies', icon: Building2 },
  { label: 'Sağlayıcılar', href: '/admin/providers', icon: Plug },
  { label: 'Komisyonlar', href: '/admin/commissions', icon: Percent },
  { label: 'Raporlar', href: '/admin/reports', icon: BarChart3 },
  { label: 'Ayarlar', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-4 py-4 border-b border-slate-700">
        <Image src="/logo.png" alt="XTurizm" width={140} height={70} className="brightness-110" />
        <div className="text-xs text-slate-400 mt-2">Platform Yönetimi</div>
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
