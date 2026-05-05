import { createAdminClient } from '@/lib/supabaseAdmin'
import BookingsByStatusChart from './BookingsByStatusChart'
import BookingsByCategoryChart from './BookingsByCategoryChart'
import BookingsByMonthChart from './BookingsByMonthChart'
import UsersByMonthChart from './UsersByMonthChart'

export default async function AdminStatsPage() {
  const supabase = createAdminClient()

  const [
    { data: bookings },
    { data: users },
    { data: categories },
  ] = await Promise.all([
    supabase.from('bookings').select('id, status, created_at, category_id'),
    supabase.from('profiles').select('id, role, created_at').neq('role', 'admin'),
    supabase.from('service_categories').select('id, name'),
  ])

  // Bookings por estado
  const statusCounts: Record<string, number> = {}
  for (const b of bookings ?? []) {
    statusCounts[b.status] = (statusCounts[b.status] ?? 0) + 1
  }
  const bookingsByStatus = [
    { name: 'Buscando', value: statusCounts['searching'] ?? 0, color: '#2563eb' },
    { name: 'Pendiente', value: statusCounts['pending'] ?? 0, color: '#d97706' },
    { name: 'Confirmado', value: statusCounts['confirmed'] ?? 0, color: '#7c3aed' },
    { name: 'Completado', value: statusCounts['completed'] ?? 0, color: '#059669' },
    { name: 'Cancelado', value: statusCounts['cancelled'] ?? 0, color: '#dc2626' },
  ]

  // Bookings por categoría
  const catMap: Record<string, string> = {}
  for (const c of categories ?? []) catMap[c.id] = c.name
  const catCounts: Record<string, number> = {}
  for (const b of bookings ?? []) {
    if (b.category_id) {
      const name = catMap[b.category_id] ?? 'Otros'
      catCounts[name] = (catCounts[name] ?? 0) + 1
    }
  }
  const bookingsByCategory = Object.entries(catCounts).map(([name, value]) => ({ name, value }))

  // Bookings por mes (últimos 6 meses)
  const monthMap: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
    monthMap[key] = 0
  }
  for (const b of bookings ?? []) {
    const d = new Date(b.created_at)
    const key = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
    if (key in monthMap) monthMap[key] = (monthMap[key] ?? 0) + 1
  }
  const bookingsByMonth = Object.entries(monthMap).map(([mes, bookings]) => ({ mes, bookings }))

  // Usuarios por mes (últimos 6 meses)
  const userMonthMap: Record<string, { clientes: number; proveedores: number }> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
    userMonthMap[key] = { clientes: 0, proveedores: 0 }
  }
  for (const u of users ?? []) {
    const d = new Date(u.created_at)
    const key = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
    if (key in userMonthMap) {
      if (u.role === 'user') userMonthMap[key].clientes++
      else if (u.role === 'provider') userMonthMap[key].proveedores++
    }
  }
  const usersByMonth = Object.entries(userMonthMap).map(([mes, v]) => ({ mes, ...v }))

  // KPIs de bookings
  const total = bookings?.length ?? 0
  const completed = statusCounts['completed'] ?? 0
  const cancelled = statusCounts['cancelled'] ?? 0
  const pending = statusCounts['pending'] ?? 0
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0

  const kpis = [
    { label: 'Total bookings', value: total, color: '#7c3aed' },
    { label: 'Completados', value: completed, sub: `${completionRate}% del total`, color: '#059669' },
    { label: 'Cancelados', value: cancelled, sub: `${cancellationRate}% del total`, color: '#dc2626' },
    { label: 'Pendientes ahora', value: pending, color: '#d97706' },
    { label: 'Clientes', value: users?.filter(u => u.role === 'user').length ?? 0, color: '#2563eb' },
    { label: 'Proveedores', value: users?.filter(u => u.role === 'provider').length ?? 0, color: '#16a34a' },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Estadísticas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Resumen de actividad de la plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>{k.label}</p>
            <p className="text-3xl font-bold" style={{ color: k.color }}>{k.value}</p>
            {k.sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Gráficos fila 1 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Bookings por estado</p>
          <BookingsByStatusChart data={bookingsByStatus} />
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Bookings por categoría</p>
          <BookingsByCategoryChart data={bookingsByCategory} />
        </div>
      </div>

      {/* Gráficos fila 2 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Bookings por mes</p>
          <BookingsByMonthChart data={bookingsByMonth} />
        </div>
        <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Nuevos usuarios por mes</p>
          <UsersByMonthChart data={usersByMonth} />
        </div>
      </div>
    </div>
  )
}
