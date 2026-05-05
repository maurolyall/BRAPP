import { createAdminClient } from '@/lib/supabaseAdmin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AdForm from '@/components/admin/AdForm'
import DeleteAdButton from '@/components/admin/DeleteAdButton'
import AdStatsChart from '@/components/admin/AdStatsChart'
import AdImageLightbox from '@/components/admin/AdImageLightbox'

function formatDate(val: string | null) {
  if (!val) return null
  return new Date(val).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: ad } = await supabase
    .from('advertisements')
    .select('*')
    .eq('id', id)
    .single()

  if (!ad) notFound()

  const since = new Date()
  since.setDate(since.getDate() - 29)
  const sinceStr = since.toISOString().split('T')[0]

  const { data: events } = await supabase
    .from('ad_events')
    .select('event_type, created_at')
    .eq('ad_id', id)
    .gte('created_at', sinceStr)
    .order('created_at', { ascending: true })

  const days: { date: string; impressions: number; clicks: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({ date: d.toISOString().split('T')[0], impressions: 0, clicks: 0 })
  }
  for (const e of events ?? []) {
    const date = e.created_at.split('T')[0]
    const day = days.find((d) => d.date === date)
    if (!day) continue
    if (e.event_type === 'impression') day.impressions++
    else if (e.event_type === 'click') day.clicks++
  }

  const ctr = ad.impressions > 0
    ? ((ad.clicks ?? 0) / ad.impressions * 100).toFixed(1)
    : '0.0'

  const now = new Date()
  const startsAt = ad.starts_at ? new Date(ad.starts_at) : null
  const endsAt = ad.ends_at ? new Date(ad.ends_at) : null
  let scheduleStatus: 'scheduled' | 'live' | 'expired' | null = null
  if (startsAt || endsAt) {
    if (endsAt && now > endsAt) scheduleStatus = 'expired'
    else if (startsAt && now < startsAt) scheduleStatus = 'scheduled'
    else scheduleStatus = 'live'
  }

  const scheduleColors = {
    scheduled: { backgroundColor: '#d9770618', color: '#d97706' },
    live:      { backgroundColor: '#05966918', color: '#059669' },
    expired:   { backgroundColor: '#dc262618', color: '#dc2626' },
  }
  const scheduleLabels = { scheduled: 'Programada', live: 'En vivo', expired: 'Vencida' }

  return (
    <div className="max-w-5xl">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/advertisements" className="text-sm font-semibold hover:underline" style={{ color: 'var(--text-muted)' }}>
          ← Publicidades
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>{ad.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: ad.target === 'provider' ? '#7c3aed18' : '#2563eb18', color: ad.target === 'provider' ? '#7c3aed' : '#2563eb' }}
            >
              {ad.target === 'provider' ? 'Proveedor' : 'Cliente'}
            </span>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: ad.active ? '#05966918' : '#dc262618', color: ad.active ? '#059669' : '#dc2626' }}
            >
              {ad.active ? 'Activa' : 'Inactiva'}
            </span>
            {scheduleStatus && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={scheduleColors[scheduleStatus]}>
                {scheduleLabels[scheduleStatus]}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AdForm ad={ad} />
          <DeleteAdButton adId={ad.id} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Left: image + info */}
        <div className="col-span-1 flex flex-col gap-4">
          {/* Image card */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="p-4">
              <AdImageLightbox src={ad.image_url} alt={ad.title} />
              <p className="text-xs mt-2 text-center" style={{ color: 'var(--text-muted)' }}>Click para ampliar</p>
            </div>
          </div>

          {/* Info card */}
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {[
              { label: 'Orden', value: String(ad.sort_order) },
              {
                label: 'Vigencia',
                value: (startsAt && endsAt)
                  ? `${formatDate(ad.starts_at)} → ${formatDate(ad.ends_at)}`
                  : startsAt
                    ? `desde ${formatDate(ad.starts_at)}`
                    : endsAt
                      ? `hasta ${formatDate(ad.ends_at)}`
                      : 'Sin fechas definidas',
              },
              { label: 'Link', value: ad.link_url ?? null },
              { label: 'Creada', value: formatDate(ad.created_at) },
            ].filter((row) => row.value !== null).map((row, i, arr) => (
              <div
                key={row.label}
                className="flex items-start justify-between px-4 py-3 gap-4"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #f7f7f7' : undefined }}
              >
                <span className="text-xs font-bold uppercase tracking-wider flex-shrink-0" style={{ color: 'var(--text-muted)', paddingTop: 1 }}>
                  {row.label}
                </span>
                <span
                  className="text-sm text-right break-all"
                  style={{ color: row.label === 'Link' ? 'var(--primary-red)' : 'var(--text-dark)', fontWeight: row.label === 'Orden' ? 700 : 400 }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: stats + chart */}
        <div className="col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Impresiones', value: (ad.impressions ?? 0).toLocaleString('es-AR'), color: '#2563eb' },
              { label: 'Clicks', value: (ad.clicks ?? 0).toLocaleString('es-AR'), color: '#7c3aed' },
              { label: 'CTR', value: `${ctr}%`, color: ad.impressions > 0 ? 'var(--primary-red)' : 'var(--text-muted)' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 flex-1" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-dark)' }}>Últimos 30 días</p>
            <AdStatsChart data={days} />
          </div>
        </div>
      </div>
    </div>
  )
}
