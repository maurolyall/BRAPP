import { createAdminClient } from '@/lib/supabaseAdmin'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import AdForm from '@/components/admin/AdForm'



export default async function AdminAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; status?: string }>
}) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { target, status } = await searchParams
  const adminClient = createAdminClient()

  let query = adminClient
    .from('advertisements')
    .select('*')
    .order('sort_order', { ascending: true })

  if (target && ['client', 'provider'].includes(target)) {
    query = query.eq('target', target)
  }
  if (status === 'active') {
    query = query.eq('active', true)
  } else if (status === 'inactive') {
    query = query.eq('active', false)
  }

  const { data: ads } = await query

  const targetFilters = [
    { label: 'Todos', value: '' },
    { label: 'Clientes', value: 'client' },
    { label: 'Proveedores', value: 'provider' },
  ]

  const statusFilters = [
    { label: 'Todos', value: '' },
    { label: 'Activas', value: 'active' },
    { label: 'Inactivas', value: 'inactive' },
  ]

  function filterHref(newTarget?: string, newStatus?: string) {
    const t = newTarget !== undefined ? newTarget : (target ?? '')
    const s = newStatus !== undefined ? newStatus : (status ?? '')
    const params = new URLSearchParams()
    if (t) params.set('target', t)
    if (s) params.set('status', s)
    const qs = params.toString()
    return `/admin/advertisements${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Publicidades</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {ads?.length ?? 0} resultado{(ads?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <AdForm />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {targetFilters.map((f) => {
            const active = (target ?? '') === f.value
            return (
              <Link
                key={f.value}
                href={filterHref(f.value, undefined)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: active ? 'var(--primary-red)' : 'var(--bg-cards)',
                  color: active ? 'white' : 'var(--text-muted)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                }}
              >
                {f.label}
              </Link>
            )
          })}
        </div>

        <div className="flex gap-2">
          {statusFilters.map((f) => {
            const active = (status ?? '') === f.value
            return (
              <Link
                key={f.value}
                href={filterHref(undefined, f.value)}
                className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: active ? '#1e293b' : 'var(--bg-cards)',
                  color: active ? 'white' : 'var(--text-muted)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                }}
              >
                {f.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              {['Imagen', 'Título', 'Destinatario', 'Vigencia', 'Impresiones', 'Clicks', 'CTR', 'Estado'].map((h) => (
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
            {ads && ads.length > 0 ? ads.map((ad, i) => (
              <tr
                key={ad.id}
                style={{ borderBottom: i < ads.length - 1 ? '1px solid #f7f7f7' : undefined }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-5 py-3">
                  <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-5 py-3 text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
                  {ad.title}
                </td>
                <td className="px-5 py-3">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: ad.target === 'provider' ? '#7c3aed18' : '#2563eb18',
                      color: ad.target === 'provider' ? '#7c3aed' : '#2563eb',
                    }}
                  >
                    {ad.target === 'provider' ? 'Proveedor' : 'Cliente'}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {ad.starts_at || ad.ends_at ? (
                    <span>
                      {ad.starts_at && ad.ends_at
                        ? `${new Date(ad.starts_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} → ${new Date(ad.ends_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`
                        : ad.starts_at
                          ? `desde ${new Date(ad.starts_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`
                          : `hasta ${new Date(ad.ends_at!).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })}`
                      }
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
                  {(ad.impressions ?? 0).toLocaleString('es-AR')}
                </td>
                <td className="px-5 py-3 text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
                  {(ad.clicks ?? 0).toLocaleString('es-AR')}
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {ad.impressions > 0 ? `${((ad.clicks ?? 0) / ad.impressions * 100).toFixed(1)}%` : '—'}
                </td>
                <td className="px-5 py-3">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: ad.active ? '#05966918' : '#dc262618',
                      color: ad.active ? '#059669' : '#dc2626',
                    }}
                  >
                    {ad.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/advertisements/${ad.id}`}
                    className="text-xs font-semibold hover:underline"
                    style={{ color: 'var(--primary-red)' }}
                  >
                    Ver →
                  </Link>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay publicidades con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
