'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      className={`text-sm font-semibold uppercase tracking-[0.1em] px-3 py-4 border-b-2 transition-all duration-200 ${
        isActive
          ? 'text-white border-blood-500'
          : 'text-white/50 border-transparent hover:text-white hover:border-blood-500/50'
      }`}
    >
      {children}
    </Link>
  )
}
