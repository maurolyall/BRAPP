'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserRole } from '@/types'
import { logout } from '@/services/auth'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  role: UserRole
}

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: '🏠', roles: ['user', 'provider', 'admin'] },
  { href: '/dashboard/services', label: 'Servicios', icon: '🔧', roles: ['provider', 'admin'] },
  { href: '/dashboard/bookings', label: 'Reservas', icon: '📅', roles: ['user', 'provider', 'admin'] },
  { href: '/dashboard/messages', label: 'Mensajes', icon: '💬', roles: ['user', 'provider', 'admin'] },
  { href: '/dashboard/profile', label: 'Mi perfil', icon: '👤', roles: ['user', 'provider', 'admin'] },
  { href: '/dashboard/admin', label: 'Administración', icon: '⚙️', roles: ['admin'] },
]

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const filtered = navItems.filter((item) => item.roles.includes(role))

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col py-6 px-4 min-h-screen"
      style={{ backgroundColor: 'var(--bg-cards)', borderRight: '1px solid #f0f0f0' }}
    >
      <div className="px-2 mb-8">
        <Link href="/">
          <Image src="/logo.svg" alt="Botón Rojo" width={110} height={26} />
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {filtered.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all"
              style={{
                backgroundColor: isActive ? 'var(--primary-red)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
              }}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all w-full mt-2"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>🚪</span>
        Cerrar sesión
      </button>
    </aside>
  )
}
