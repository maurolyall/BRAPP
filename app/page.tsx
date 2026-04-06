import Link from 'next/link'
import Image from 'next/image'
import PublicHeader from '@/components/layout/PublicHeader'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--bg-body)' }}>
      {/* Gradient overlay: transparent top → red bottom */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'linear-gradient(to top, var(--primary-red) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        <PublicHeader />

        <div className="px-4 pt-12 pb-12">
          <div className="w-full max-w-sm mx-auto text-center animate-fade-in">
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>
              ¡Bienvenido!
            </h1>
            <p className="text-base font-medium mb-8" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Estás a un botón de solucionar tus problemas
            </p>

            <Image
              src="/icons/index-icon.svg"
              alt=""
              width={400}
              height={400}
              className="w-full h-auto mb-10"
            />

            <div className="flex flex-col gap-3">
              <Link href="/login" className="btn-primary text-center">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="px-8 py-3 rounded-full font-semibold text-sm transition-colors text-center"
                style={{ backgroundColor: 'var(--bg-cards)', color: 'var(--text-muted)' }}
              >
                Crear cuenta
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
