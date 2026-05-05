import { createAdminClient } from '@/lib/supabaseAdmin'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = createAdminClient()

  const [
    { count: totalUsers },
    { count: totalProviders },
    { count: totalBookings },
    { count: pendingBookings },
    { count: completedBookings },
    { count: cancelledBookings },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
  ])

  const metrics = [
    { label: 'Clientes', value: totalUsers ?? 0, href: '/admin/users?role=user', color: '#2563eb', bg: '#2563eb12' },
    { label: 'Proveedores', value: totalProviders ?? 0, href: '/admin/users?role=provider', color: '#16a34a', bg: '#16a34a12' },
    { label: 'Bookings totales', value: totalBookings ?? 0, href: '/admin/bookings', color: '#7c3aed', bg: '#7c3aed12' },
    { label: 'Pendientes', value: pendingBookings ?? 0, href: '/admin/bookings?status=pending', color: '#d97706', bg: '#d9770612' },
    { label: 'Completados', value: completedBookings ?? 0, href: '/admin/bookings?status=completed', color: '#059669', bg: '#05966912' },
    { label: 'Cancelados', value: cancelledBookings ?? 0, href: '/admin/bookings?status=cancelled', color: '#dc2626', bg: '#dc262612' },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Panel de administración</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Resumen general de Botón Rojo</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="rounded-2xl p-5 flex flex-col gap-2 hover:scale-[1.02] transition-transform"
            style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: m.bg, color: m.color }}
            >
              {m.value}
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{m.label}</span>
          </Link>
        ))}
      </div>

      <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Accesos rápidos</h2>
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/admin/users', label: 'Gestionar usuarios', desc: 'Ver y filtrar clientes y proveedores' },
          { href: '/admin/bookings', label: 'Gestionar bookings', desc: 'Ver todos los pedidos y su estado' },
          { href: '/admin/categories', label: 'Gestionar categorías', desc: 'Activar o desactivar categorías de servicio' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl p-5 flex flex-col gap-1 hover:scale-[1.02] transition-transform"
            style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>{item.label}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
