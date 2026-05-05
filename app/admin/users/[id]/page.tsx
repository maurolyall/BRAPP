import { createAdminClient } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ChangeRoleButton from '@/components/admin/ChangeRoleButton'

const ROLE_LABELS: Record<string, string> = { user: 'Cliente', provider: 'Proveedor', admin: 'Admin' }
const ROLE_COLORS: Record<string, string> = { user: '#2563eb', provider: '#16a34a', admin: '#dc2626' }

const STATUS_LABELS: Record<string, string> = {
  searching: 'Buscando', pending: 'Pendiente', confirmed: 'Confirmado',
  completed: 'Completado', cancelled: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  searching: '#2563eb', pending: '#d97706', confirmed: '#7c3aed',
  completed: '#059669', cancelled: '#dc2626',
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (!profile) notFound()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, created_at, address, description')
    .or(`user_id.eq.${id},provider_id.eq.${id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  const infoFields = [
    { label: 'Email', value: profile.email },
    { label: 'Teléfono', value: profile.phone },
    { label: 'DNI', value: profile.dni },
    { label: 'CUIT', value: profile.cuit },
    { label: 'Razón social', value: profile.business_name },
    { label: 'Ciudad', value: profile.city },
    { label: 'Dirección', value: profile.address },
    { label: 'Piso/Apto', value: profile.floor_apt },
    { label: 'Registrado', value: new Date(profile.created_at).toLocaleString('es-AR') },
  ]

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-sm font-semibold hover:underline" style={{ color: 'var(--text-muted)' }}>
          ← Usuarios
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>
            {profile.full_name || 'Sin nombre'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <ChangeRoleButton userId={profile.id} currentRole={profile.role} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{profile.email}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Información</h2>
            <div className="flex flex-col gap-3">
              {infoFields.map((f) => f.value ? (
                <div key={f.label}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.label}</p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>{f.value}</p>
                </div>
              ) : null)}
            </div>
          </div>
        </div>

        <div className="col-span-2">
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#f0f0f0' }}>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
                Bookings ({bookings?.length ?? 0})
              </h2>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  {['Descripción', 'Dirección', 'Estado', 'Fecha', ''].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings && bookings.length > 0 ? bookings.map((b, i) => (
                  <tr key={b.id} style={{ borderBottom: i < bookings.length - 1 ? '1px solid #f7f7f7' : undefined }} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-dark)' }}>
                      {b.description ? b.description.slice(0, 40) + (b.description.length > 40 ? '…' : '') : '—'}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {b.address || '—'}
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
                )) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                      Sin bookings.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
