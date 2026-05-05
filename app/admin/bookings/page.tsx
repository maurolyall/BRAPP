import { createAdminClient } from '@/lib/supabaseAdmin'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  searching: 'Buscando', pending: 'Pendiente', confirmed: 'Confirmado',
  completed: 'Completado', cancelled: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  searching: '#2563eb', pending: '#d97706', confirmed: '#7c3aed',
  completed: '#059669', cancelled: '#dc2626',
}
const STATUSES = ['searching', 'pending', 'confirmed', 'completed', 'cancelled']

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('bookings')
    .select(`
      id, status, created_at, address, description,
      user:profiles!bookings_user_id_fkey(id, full_name, email),
      provider:profiles!bookings_provider_id_fkey(id, full_name),
      category:service_categories!bookings_category_id_fkey(name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (status && STATUSES.includes(status)) {
    query = query.eq('status', status)
  }

  const { data: bookings } = await query

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Bookings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {bookings?.length ?? 0} resultados
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/admin/bookings"
          className="px-4 py-1.5 rounded-full text-sm font-semibold"
          style={{
            backgroundColor: !status ? 'var(--primary-red)' : 'var(--bg-cards)',
            color: !status ? 'white' : 'var(--text-muted)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          }}
        >
          Todos
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/bookings?status=${s}`}
            className="px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: status === s ? STATUS_COLORS[s] : 'var(--bg-cards)',
              color: status === s ? 'white' : 'var(--text-muted)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              {['Cliente', 'Categoría', 'Proveedor', 'Dirección', 'Estado', 'Fecha', ''].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings && bookings.length > 0 ? bookings.map((b, i) => {
              const user = Array.isArray(b.user) ? b.user[0] : b.user
              const provider = Array.isArray(b.provider) ? b.provider[0] : b.provider
              const category = Array.isArray(b.category) ? b.category[0] : b.category
              return (
                <tr key={b.id} style={{ borderBottom: i < bookings.length - 1 ? '1px solid #f7f7f7' : undefined }} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    {user ? (
                      <Link href={`/admin/users/${user.id}`} className="text-sm font-semibold hover:underline" style={{ color: 'var(--text-dark)' }}>
                        {user.full_name || user.email}
                      </Link>
                    ) : <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {category?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    {provider ? (
                      <Link href={`/admin/users/${provider.id}`} className="text-sm hover:underline" style={{ color: 'var(--text-muted)' }}>
                        {provider.full_name}
                      </Link>
                    ) : <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin asignar</span>}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)', maxWidth: 160 }}>
                    <span className="truncate block">{b.address || '—'}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[b.status]}18`, color: STATUS_COLORS[b.status] }}>
                      {STATUS_LABELS[b.status] ?? b.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {new Date(b.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-3">
                    <Link href={`/admin/bookings/${b.id}`} className="text-xs font-semibold hover:underline" style={{ color: 'var(--primary-red)' }}>
                      Ver
                    </Link>
                  </td>
                </tr>
              )
            }) : (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay bookings.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
