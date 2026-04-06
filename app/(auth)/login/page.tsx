'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/services/auth'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PublicHeader from '@/components/layout/PublicHeader'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await login(email, password)
    if (error) {
      setError(error)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-body)' }}>
      <PublicHeader />
      <div className="px-4 pt-8 pb-12">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Bienvenido de vuelta</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Iniciá sesión en tu cuenta</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email"
              required
            />
            <Input
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              label="Contraseña"
              required
            />

            {error && (
              <p className="text-sm text-center font-medium" style={{ color: 'var(--primary-red)' }}>
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Iniciar sesión
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-muted)' }}>
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="font-semibold" style={{ color: 'var(--primary-red)' }}>
              Registrate gratis
            </Link>
          </p>
        </div>
      </div>
      </div>
    </main>
  )
}
