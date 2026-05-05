import { createAdminClient } from '@/lib/supabaseAdmin'
import Link from 'next/link'
import { notFound } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  searching: 'Buscando', pending: 'Pendiente', confirmed: 'Confirmado',
  completed: 'Completado', cancelled: 'Cancelado',
}
const STATUS_COLORS: Record<string, string> = {
  searching: '#2563eb', pending: '#d97706', confirmed: '#7c3aed',
  completed: '#059669', cancelled: '#dc2626',
}

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      user:profiles!bookings_user_id_fkey(id, full_name, email, phone, city),
      provider:profiles!bookings_provider_id_fkey(id, full_name, email, phone, city),
      category:service_categories!bookings_category_id_fkey(name)
    `)
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const user = Array.isArray(booking.user) ? booking.user[0] : booking.user
  const provider = Array.isArray(booking.provider) ? booking.provider[0] : booking.provider
  const category = Array.isArray(booking.category) ? booking.category[0] : booking.category

  const bookingFields = [
    { label: 'Estado', value: STATUS_LABELS[booking.status] ?? booking.status, color: STATUS_COLORS[booking.status] },
    { label: 'Categoría', value: category?.name ?? null },
    { label: 'Dirección', value: booking.address },
    { label: 'Descripción', value: booking.description },
    { label: 'Fecha preferida', value: booking.scheduled_date === 'today' ? 'Hoy' : booking.scheduled_date === 'coordinate' ? 'A coordinar' : null },
    { label: 'Método de pago', value: booking.payment_method === 'coordinate' ? 'A coordinar' : booking.payment_method === 'prepaid' ? 'Prepago' : null },
    { label: 'Creado', value: new Date(booking.created_at).toLocaleString('es-AR') },
    { label: 'Actualizado', value: new Date(booking.updated_at).toLocaleString('es-AR') },
  ]

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/bookings" className="text-sm font-semibold hover:underline" style={{ color: 'var(--text-muted)' }}>
          ← Bookings
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Detalle de booking</h1>
        <span
          className="text-sm font-bold px-3 py-1 rounded-full"
          style={{ backgroundColor: `${STATUS_COLORS[booking.status]}18`, color: STATUS_COLORS[booking.status] }}
        >
          {STATUS_LABELS[booking.status] ?? booking.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 flex flex-col gap-4">
          <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Información</h2>
            <div className="flex flex-col gap-3">
              {bookingFields.map((f) => f.value ? (
                <div key={f.label}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.label}</p>
                  <p className="text-sm font-semibold" style={{ color: f.color ?? 'var(--text-dark)' }}>{f.value}</p>
                </div>
              ) : null)}
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-4">
          {user && (
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-muted)' }}>CLIENTE</p>
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>{user.full_name || 'Sin nombre'}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                  {user.phone && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.phone}</p>}
                  {user.city && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.city}</p>}
                </div>
                <Link href={`/admin/users/${user.id}`} className="text-xs font-semibold hover:underline" style={{ color: 'var(--primary-red)' }}>
                  Ver perfil
                </Link>
              </div>
            </div>
          )}

          {provider ? (
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-muted)' }}>PROVEEDOR</p>
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>{provider.full_name || 'Sin nombre'}</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{provider.email}</p>
                  {provider.phone && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{provider.phone}</p>}
                  {provider.city && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{provider.city}</p>}
                </div>
                <Link href={`/admin/users/${provider.id}`} className="text-xs font-semibold hover:underline" style={{ color: 'var(--primary-red)' }}>
                  Ver perfil
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-5" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>PROVEEDOR</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sin proveedor asignado aún.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
