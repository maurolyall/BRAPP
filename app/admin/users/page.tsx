import { createAdminClient } from '@/lib/supabaseAdmin'
import Link from 'next/link'

const ROLE_LABELS: Record<string, string> = {
  user: 'Cliente',
  provider: 'Proveedor',
  admin: 'Admin',
}

const ROLE_COLORS: Record<string, string> = {
  user: '#2563eb',
  provider: '#16a34a',
  admin: '#dc2626',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, role, phone, city, created_at')
    .order('created_at', { ascending: false })

  if (role && ['user', 'provider', 'admin'].includes(role)) {
    query = query.eq('role', role)
  }

  const { data: users } = await query

  const filters = [
    { label: 'Todos', value: '' },
    { label: 'Clientes', value: 'user' },
    { label: 'Proveedores', value: 'provider' },
    { label: 'Admins', value: 'admin' },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Usuarios</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {users?.length ?? 0} resultados
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/admin/users?role=${f.value}` : '/admin/users'}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
            style={{
              backgroundColor: role === f.value || (!role && !f.value) ? 'var(--primary-red)' : 'var(--bg-cards)',
              color: role === f.value || (!role && !f.value) ? 'white' : 'var(--text-muted)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              {['Nombre', 'Email', 'Teléfono', 'Ciudad', 'Rol', 'Registrado', ''].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? users.map((u, i) => (
              <tr
                key={u.id}
                style={{ borderBottom: i < users.length - 1 ? '1px solid #f7f7f7' : undefined }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-3 text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
                  {u.full_name || '—'}
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {u.email}
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {u.phone || '—'}
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {u.city || '—'}
                </td>
                <td className="px-5 py-3">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${ROLE_COLORS[u.role]}18`, color: ROLE_COLORS[u.role] }}
                  >
                    {ROLE_LABELS[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(u.created_at).toLocaleDateString('es-AR')}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: 'var(--primary-red)' }}
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
