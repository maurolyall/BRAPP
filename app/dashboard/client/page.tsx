import { createServerClient } from '@/lib/supabaseServer'
import Image from 'next/image'
import Link from 'next/link'
import AdSlider from '@/components/dashboard/AdSlider'

export default async function ClientHomePage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div className="flex flex-col gap-5">

      {/* Saludo + ilustración */}
      <div className="flex flex-col items-center gap-1 pt-2">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-dark)' }}>
          ¡Hola, {firstName || 'vecino'}!
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ¿En qué te puedo ayudar?
        </p>
      </div>

      <div className="flex justify-center">
        <Image
          src="/icons/boton.svg"
          alt="Botón Rojo"
          width={280}
          height={280}
          className="w-full max-w-[280px] h-auto"
          priority
        />
      </div>

      {/* Buscador */}
      <Link
        href="/dashboard/client/services"
        className="flex items-center gap-3 px-4 py-3.5 rounded-full"
        style={{
          backgroundColor: 'var(--bg-cards)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 28, height: 28, border: '2px solid var(--text-muted)' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="6" y1="1" x2="6" y2="11" />
            <line x1="1" y1="6" x2="11" y2="6" />
          </svg>
        </div>
        <span className="flex-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          ¿Qué servicio necesitás?
        </span>
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{ width: 34, height: 34, backgroundColor: 'var(--primary-red)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </div>
      </Link>

      {/* Publicidad */}
      <AdSlider />
    </div>
  )
}
