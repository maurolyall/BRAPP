'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { register } from '@/services/auth'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { UserRole } from '@/types'
import PublicHeader from '@/components/layout/PublicHeader'
import { createClient } from '@/lib/supabaseClient'

type Step =
  | 'select'
  | 'client-form'
  | 'client-success'
  | 'provider-1'
  | 'provider-2'
  | 'provider-3'
  | 'provider-4'
  | 'provider-5'
  | 'provider-success'

type ServiceCategory = {
  id: string
  name: string
  icon_url: string | null
}

// Shared card header used in registration steps
function RegistrationCardHeader() {
  return (
    <div className="text-center mb-6">
      <Image
        src="/icons/ENCONTRADO.svg"
        alt=""
        width={400}
        height={400}
        className="w-2/3 h-auto mx-auto mb-4"
      />
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
        Completá el registro y comenzá a disfrutar de todos los servicios que tenemos para ofrecerte.
      </p>
    </div>
  )
}

// Back / Next button row
function StepButtons({ onBack, onNext, nextLabel = 'Siguiente' }: { onBack: () => void; onNext?: () => void; nextLabel?: string }) {
  return (
    <div className="flex gap-3 mt-4">
      <Button type="button" variant="secondary" className="flex-1" onClick={onBack}>
        Atrás
      </Button>
      <Button type={onNext ? 'button' : 'submit'} variant="primary" className="flex-1" onClick={onNext}>
        {nextLabel}
      </Button>
    </div>
  )
}

function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('select')

  // Client form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Provider form state
  const [providerEmail, setProviderEmail] = useState('')
  const [providerPassword, setProviderPassword] = useState('')
  const [providerName, setProviderName] = useState('')
  const [providerDob, setProviderDob] = useState('')
  const [providerCity, setProviderCity] = useState('')
  const [providerAddress, setProviderAddress] = useState('')
  const [providerFloor, setProviderFloor] = useState('')
  const [providerLot, setProviderLot] = useState('')
  const [providerPhone, setProviderPhone] = useState('')

  // Provider step 4
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [search, setSearch] = useState('')

  // Provider step 5
  const [termsScrolled, setTermsScrolled] = useState(false)

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setTermsScrolled(true)
    }
  }

  useEffect(() => {
    if (step === 'provider-4') {
      const supabase = createClient()
      supabase
        .from('service_categories')
        .select('id, name, icon_url')
        .eq('active', true)
        .order('name')
        .then(({ data }) => setCategories(data ?? []))
    }
  }, [step])

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleClientRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await register(email, password, name, 'user' as UserRole)
    if (error) {
      setError(error)
    } else {
      setStep('client-success')
    }
    setLoading(false)
  }

  const handleProviderRegister = async () => {
    setError(null)
    setLoading(true)

    const supabase = createClient()

    // 1. Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: providerEmail,
      password: providerPassword,
      options: {
        data: { full_name: providerName, role: 'provider' },
      },
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? 'Error al registrarse')
      setLoading(false)
      return
    }

    const userId = data.user.id

    // 2. Update profile with extra fields
    await supabase
      .from('profiles')
      .update({
        phone: providerPhone,
        date_of_birth: providerDob || null,
        city: providerCity,
        address: providerAddress,
        floor_apt: providerFloor || null,
        lot: providerLot || null,
      })
      .eq('id', userId)

    // 3. Insert provider categories
    if (selectedCategories.length > 0) {
      await supabase.from('provider_categories').insert(
        selectedCategories.map((categoryId) => ({
          provider_id: userId,
          category_id: categoryId,
        }))
      )
    }

    setLoading(false)
    setStep('provider-success')
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-body)' }}>
      <PublicHeader />

      <div className="px-4 pt-8 pb-12">

        {/* STEP 1: Select role */}
        {step === 'select' && (
          <div className="w-full max-w-sm mx-auto text-center animate-fade-in">
            <Image
              src="/icons/DUDA.svg"
              alt=""
              width={180}
              height={180}
              className="mx-auto mb-5"
            />
            <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-dark)' }}>
              ¿Qué tipo de usuario sos?
            </h1>
            <div className="flex gap-4">
              <div className="flex-1 flex flex-col items-center gap-3">
                <button
                  onClick={() => setStep('client-form')}
                  className="card w-full py-6 px-4 flex items-center justify-center transition-all hover:shadow-md"
                >
                  <Image src="/icons/CLIENTE.svg" alt="Cliente" width={80} height={80} className="h-20 w-auto" />
                </button>
                <span className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>Cliente</span>
              </div>

              <div className="flex-1 flex flex-col items-center gap-3">
                <button
                  onClick={() => setStep('provider-1')}
                  className="card w-full py-6 px-4 flex items-center justify-center transition-all hover:shadow-md"
                >
                  <Image src="/icons/PROVEEDOR.svg" alt="Proveedor" width={80} height={80} className="h-20 w-auto" />
                </button>
                <span className="font-bold text-sm" style={{ color: 'var(--text-dark)' }}>Proveedor</span>
              </div>
            </div>
            <p className="text-center text-sm mt-8" style={{ color: 'var(--text-muted)' }}>
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="font-semibold" style={{ color: 'var(--primary-red)' }}>
                Iniciá sesión
              </Link>
            </p>
          </div>
        )}

        {/* CLIENT STEP 2: Registration form */}
        {step === 'client-form' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="card p-8">
              <RegistrationCardHeader />

              <form onSubmit={handleClientRegister} className="flex flex-col gap-4">
                <Input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  label="Nombre"
                  required
                />
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
                  placeholder="Mínimo 6 caracteres"
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
                  Crear cuenta
                </Button>
              </form>

              <Button
                type="button"
                variant="secondary"
                className="w-full mt-4"
                onClick={() => setStep('select')}
              >
                Atrás
              </Button>
            </div>
          </div>
        )}

        {/* CLIENT STEP 3: Success */}
        {step === 'client-success' && (
          <div className="w-full max-w-sm mx-auto text-center animate-fade-in">
            <Image
              src="/icons/boton-happy.svg"
              alt="Botón Happy"
              width={400}
              height={400}
              className="w-4/5 h-auto mx-auto mb-6 animate-scale-in"
            />
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              ¡Genial!
            </h2>
            <p className="text-base font-medium mb-8" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Ya estás listo para disfrutar de los beneficios de Botón Rojo
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-28 h-28 rounded-full font-bold text-base text-white flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'var(--primary-red)' }}
            >
              Ingresar
            </button>
          </div>
        )}

        {/* PROVIDER STEP 1: Email */}
        {step === 'provider-1' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="card p-8">
              <RegistrationCardHeader />
              <div className="flex flex-col gap-4">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={providerEmail}
                  onChange={(e) => setProviderEmail(e.target.value)}
                  label="Email"
                  required
                />
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={providerPassword}
                  onChange={(e) => setProviderPassword(e.target.value)}
                  label="Contraseña"
                  required
                />
                <StepButtons
                  onBack={() => setStep('select')}
                  onNext={() => setStep('provider-2')}
                />
              </div>
            </div>
          </div>
        )}

        {/* PROVIDER STEP 2: Personal data */}
        {step === 'provider-2' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="card p-8">
              <RegistrationCardHeader />
              <div className="flex flex-col gap-4">
                <Input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  label="Nombre completo"
                  required
                />
                <Input
                  type="date"
                  value={providerDob}
                  onChange={(e) => setProviderDob(e.target.value)}
                  label="Fecha de nacimiento"
                  required
                />
                <Input
                  type="text"
                  placeholder="Tu localidad"
                  value={providerCity}
                  onChange={(e) => setProviderCity(e.target.value)}
                  label="Localidad"
                  required
                />
                <Input
                  type="text"
                  placeholder="Calle y número"
                  value={providerAddress}
                  onChange={(e) => setProviderAddress(e.target.value)}
                  label="Domicilio"
                  required
                />
                <Input
                  type="text"
                  placeholder="Ej: 3° B"
                  value={providerFloor}
                  onChange={(e) => setProviderFloor(e.target.value)}
                  label="Piso / Depto"
                />
                <Input
                  type="text"
                  placeholder="Número de lote"
                  value={providerLot}
                  onChange={(e) => setProviderLot(e.target.value)}
                  label="Lote"
                />
                <StepButtons
                  onBack={() => setStep('provider-1')}
                  onNext={() => setStep('provider-3')}
                />
              </div>
            </div>
          </div>
        )}

        {/* PROVIDER STEP 3: Phone verification */}
        {step === 'provider-3' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="card p-8">
              <RegistrationCardHeader />
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>
                    Teléfono
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="flex items-center px-3 rounded-full text-sm font-semibold border flex-shrink-0"
                      style={{ backgroundColor: 'var(--bg-body)', borderColor: '#d0d0d0', color: 'var(--text-dark)' }}
                    >
                      +54
                    </div>
                    <input
                      type="tel"
                      placeholder="Ej: 11 1234 5678"
                      value={providerPhone}
                      onChange={(e) => setProviderPhone(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-full text-sm border outline-none"
                      style={{ borderColor: '#d0d0d0', backgroundColor: 'var(--bg-cards)', color: 'var(--text-dark)' }}
                    />
                  </div>
                </div>

                <Button type="button" variant="secondary" className="w-full">
                  Obtener código
                </Button>

                <StepButtons
                  onBack={() => setStep('provider-2')}
                  onNext={() => setStep('provider-4')}
                />
              </div>
            </div>
          </div>
        )}

        {/* PROVIDER STEP 4: Service selection */}
        {step === 'provider-4' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="card p-6">
              <h2 className="text-lg font-bold mb-1 text-center" style={{ color: 'var(--text-dark)' }}>
                ¿Qué servicios ofrecés?
              </h2>
              <p className="text-sm text-center mb-5" style={{ color: 'var(--text-muted)' }}>
                Podés seleccionar más de uno
              </p>

              {/* Search */}
              <input
                type="text"
                placeholder="Buscar servicio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-3 rounded-full text-sm border outline-none mb-5"
                style={{ borderColor: '#e0e0e0', backgroundColor: 'var(--bg-body)', color: 'var(--text-dark)' }}
              />

              {/* Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {filteredCategories.map((cat) => {
                  const selected = selectedCategories.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className="relative card py-6 px-4 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-md"
                      style={selected ? { outline: '2px solid var(--primary-red)' } : {}}
                    >
                      {/* Selection indicator */}
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: selected ? 'var(--primary-red)' : '#d0d0d0',
                          backgroundColor: selected ? 'var(--primary-red)' : 'transparent',
                        }}
                      >
                        {selected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {cat.icon_url && (
                        <Image
                          src={cat.icon_url}
                          alt={cat.name}
                          width={60}
                          height={60}
                          className="h-24 w-auto"
                        />
                      )}
                      <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              <StepButtons
                onBack={() => setStep('provider-3')}
                onNext={() => setStep('provider-5')}
              />
            </div>
          </div>
        )}

        {/* PROVIDER STEP 5: Terms and conditions */}
        {step === 'provider-5' && (
          <div className="w-full max-w-md mx-auto animate-fade-in">
            <div className="card p-8 mb-4">
              <div className="text-center">
                <Image
                  src="/icons/leer.svg"
                  alt=""
                  width={400}
                  height={400}
                  className="w-2/3 h-auto mx-auto mb-4"
                />
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-dark)' }}>
                  Lee y aceptá los términos y condiciones
                </h2>
              </div>
            </div>

            <div className="card p-6 mb-4">
              <div
                className="overflow-y-auto text-sm leading-relaxed"
                style={{ maxHeight: '280px', color: 'var(--text-muted)' }}
                onScroll={handleTermsScroll}
              >
                <p className="font-semibold mb-3" style={{ color: 'var(--text-dark)' }}>Términos y Condiciones de Uso — Botón Rojo</p>
                <p className="mb-3">Al registrarte como proveedor en Botón Rojo aceptás los presentes términos y condiciones en su totalidad. Por favor leelos con atención antes de continuar.</p>
                <p className="font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>1. Registro y veracidad de datos</p>
                <p className="mb-3">El proveedor se compromete a brindar información verdadera, completa y actualizada al momento del registro. Botón Rojo se reserva el derecho de suspender o eliminar cuentas con información falsa o incompleta.</p>
                <p className="font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>2. Responsabilidad del proveedor</p>
                <p className="mb-3">El proveedor es el único responsable de los servicios que ofrece, su calidad, seguridad y cumplimiento. Botón Rojo actúa como plataforma de intermediación y no es responsable de los trabajos realizados.</p>
                <p className="font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>3. Conducta y ética</p>
                <p className="mb-3">El proveedor se compromete a tratar a los clientes con respeto y profesionalismo. Queda prohibido el uso de la plataforma para actividades ilegales, fraudulentas o contrarias a la buena fe.</p>
                <p className="font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>4. Comisiones y pagos</p>
                <p className="mb-3">Botón Rojo podrá aplicar comisiones sobre los servicios contratados a través de la plataforma. Las condiciones específicas serán comunicadas oportunamente.</p>
                <p className="font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>5. Modificaciones</p>
                <p className="mb-3">Botón Rojo se reserva el derecho de modificar estos términos en cualquier momento. Los cambios serán notificados y el uso continuado de la plataforma implicará la aceptación de los nuevos términos.</p>
                <p className="font-semibold mb-2" style={{ color: 'var(--text-dark)' }}>6. Privacidad</p>
                <p className="mb-6">Los datos personales serán tratados conforme a nuestra Política de Privacidad, en cumplimiento con la legislación argentina vigente (Ley 25.326).</p>
                <p className="text-center font-medium" style={{ color: 'var(--text-dark)' }}>— Fin de los términos y condiciones —</p>
              </div>

              {termsScrolled && (
                <>
                  {error && (
                    <p className="text-sm text-center font-medium mt-4" style={{ color: 'var(--primary-red)' }}>
                      {error}
                    </p>
                  )}
                  <div className="mt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => setStep('provider-4')}
                      disabled={loading}
                    >
                      Atrás
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      className="flex-1"
                      loading={loading}
                      onClick={handleProviderRegister}
                    >
                      Registrarme
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* PROVIDER SUCCESS */}
        {step === 'provider-success' && (
          <div className="w-full max-w-sm mx-auto text-center animate-fade-in">
            <Image
              src="/icons/proveedor-creado.svg"
              alt=""
              width={400}
              height={400}
              className="w-4/5 h-auto mx-auto mb-6 animate-scale-in"
            />
            <h2 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-dark)' }}>
              ¡Genial!
            </h2>
            <p className="text-base font-medium mb-8" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Ya estás listo para disfrutar de los beneficios de Botón Rojo
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-28 h-28 rounded-full font-bold text-base text-white flex items-center justify-center mx-auto"
              style={{ backgroundColor: 'var(--primary-red)' }}
            >
              Ingresar
            </button>
          </div>
        )}

      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
