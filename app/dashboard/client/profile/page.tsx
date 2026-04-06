import { createServerClient } from '@/lib/supabaseServer'
import Link from 'next/link'
import ProfileSettings from '@/components/dashboard/client/ProfileSettings'

export default async function ClientProfilePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { count: bookingsCount }] = await Promise.all([
    supabase.from('profiles').select('full_name, city, avatar_url, created_at').eq('id', user!.id).single(),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
  ])

  const avatarUrl = profile?.avatar_url ?? null
  const fullName = profile?.full_name || 'Sin nombre'
  const city = profile?.city || null
  const memberSince = profile?.created_at ? new Date(profile.created_at).getFullYear() : '—'
  const connections = bookingsCount ?? 0

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold animate-fade-in" style={{ color: 'var(--text-dark)' }}>Mi perfil</h1>

      {/* User card */}
      <Link
        href="/dashboard/client/profile/edit"
        className="flex items-center gap-4 rounded-2xl p-4 animate-fade-in"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '60ms' }}
      >
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
          style={{ backgroundColor: '#f0f0f0', border: '3px solid var(--bg-body)' }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate" style={{ color: 'var(--text-dark)' }}>
            {fullName}
          </p>
          {city && (
            <p className="text-sm truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {city}
            </p>
          )}
        </div>

        {/* Arrow */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>

      {/* Estadísticas */}
      <h2 className="text-xl font-bold animate-fade-in" style={{ color: 'var(--text-dark)', animationDelay: '120ms' }}>Estadísticas</h2>

      <div
        className="rounded-2xl p-4 grid grid-cols-3 gap-1 animate-fade-in"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)', animationDelay: '180ms' }}
      >
        {/* Miembro desde */}
        <div className="flex flex-col items-center gap-2 px-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-dark)' }}>
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
          </svg>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-center leading-tight" style={{ color: 'var(--text-muted)' }}>Miembro desde</span>
            <span className="text-sm font-bold leading-none" style={{ color: 'var(--text-dark)' }}>{memberSince}</span>
          </div>
        </div>

        {/* Conexiones */}
        <div className="flex flex-col items-center gap-2 px-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-dark)' }}>
            <path d="M20.5 3.5L3 10.5l7 2 2 7 8.5-16z" />
          </svg>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-center leading-tight" style={{ color: 'var(--text-muted)' }}>Conexiones</span>
            <span className="text-sm font-bold leading-none" style={{ color: 'var(--text-dark)' }}>{connections}</span>
          </div>
        </div>

        {/* Plan actual */}
        <div className="flex flex-col items-center gap-2 px-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-dark)' }}>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <circle cx="8" cy="12" r="2" />
            <line x1="13" y1="10" x2="19" y2="10" />
            <line x1="13" y1="14" x2="17" y2="14" />
          </svg>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-xs text-center leading-tight" style={{ color: 'var(--text-muted)' }}>Plan actual</span>
            <span className="text-sm font-bold leading-none" style={{ color: 'var(--text-dark)' }}>Gratuito</span>
          </div>
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '240ms' }}>
        <ProfileSettings />
      </div>
    </div>
  )
}
