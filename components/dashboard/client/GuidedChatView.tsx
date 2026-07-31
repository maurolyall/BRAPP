'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { getFlowForCategory, ChatStep } from '@/lib/guidedChatFlow'
import { Banknote, CreditCard, MapPin, Calendar, ChevronDown, ChevronRight, Info } from 'lucide-react'

interface Category { id: string; name: string }

interface ChatMessage {
  from: 'bot' | 'user'
  text: string
  chips?: string[]
}

type Phase = 'category' | 'questions' | 'form' | 'done'

interface FormData {
  address: string
  scheduledDate: string
  timeSlot: string
  description: string
  paymentMethod: string
  dateMode: 'coordinate' | 'urgent'
}

const TIME_SLOTS = [
  { value: 'fullday', label: 'De 8 a 17hs', color: '#34d399' },
  { value: 'morning', label: 'De 8 a 12hs', color: '#60a5fa' },
  { value: 'afternoon', label: 'De 12 a 17hs', color: '#f59e0b' },
]

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Efectivo', Icon: Banknote },
  { value: 'card', label: 'Tarjeta', Icon: CreditCard },
]

function getUpcomingDates(n = 7) {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const result = []
  for (let i = 0; i < n; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    result.push({
      value: d.toISOString().split('T')[0],
      day: d.getDate(),
      dayName: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : days[d.getDay()],
      month: months[d.getMonth()],
    })
  }
  return result
}

const UPCOMING_DATES = getUpcomingDates(7)

export default function GuidedChatView({ categories, userAddress = '' }: { categories: Category[]; userAddress?: string }) {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [phase, setPhase] = useState<Phase>('category')
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [steps, setSteps] = useState<ChatStep[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [messages, setMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: '¿Qué tipo de servicio necesitás?', chips: categories.map((c) => c.name) },
  ])
  const [form, setForm] = useState<FormData>({
    address: userAddress,
    scheduledDate: UPCOMING_DATES[0].value,
    timeSlot: 'fullday',
    description: '',
    paymentMethod: 'cash',
    dateMode: 'coordinate',
  })
  const [editingAddress, setEditingAddress] = useState(!userAddress)
  const [submitting, setSubmitting] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 80)
  }, [messages])

  const addUserMessage = (text: string) => setMessages((prev) => [...prev, { from: 'user', text }])

  const addBotMessage = (text: string, chips?: string[]) => {
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'bot', text, chips }])
    }, 400)
  }

  const handleCategorySelect = (name: string) => {
    const cat = categories.find((c) => c.name === name)
    if (!cat) return
    setSelectedCategory(cat)
    addUserMessage(name)

    const flow = getFlowForCategory(name)
    setSteps(flow.steps)
    setStepIndex(0)
    setPhase('questions')

    addBotMessage('Perfecto. Algunas preguntas para entender mejor tu pedido:')
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'bot', text: flow.steps[0].question, chips: flow.steps[0].chips }])
      setActiveChips(flow.steps[0].chips ?? [])
    }, 900)
  }

  const handleChipSelect = (chip: string) => {
    const currentStep = steps[stepIndex]
    setAnswers((prev) => ({ ...prev, [currentStep.id]: chip }))
    addUserMessage(chip)

    const nextIndex = stepIndex + 1
    if (nextIndex < steps.length) {
      setStepIndex(nextIndex)
      addBotMessage(steps[nextIndex].question, steps[nextIndex].chips)
      setTimeout(() => setActiveChips(steps[nextIndex].chips ?? []), 450)
    } else {
      setActiveChips([])
      setPhase('form')
      addBotMessage('Perfecto. Solo necesito algunos datos más para completar tu solicitud.')
    }
  }

  const [activeChips, setActiveChips] = useState<string[]>(categories.map((c) => c.name))

  const [freeInput, setFreeInput] = useState('')
  const handleFreeSubmit = () => {
    if (!freeInput.trim()) return
    handleChipSelect(freeInput.trim())
    setFreeInput('')
  }

  const handleSubmit = async () => {
    if (!selectedCategory || !form.address.trim()) return
    setSubmitting(true)
    try {
      const description = [
        ...Object.entries(answers).map(([, v]) => v),
        form.description,
      ].filter(Boolean).join(' · ')

      const scheduledDate = form.dateMode === 'coordinate'
        ? `${form.scheduledDate} ${form.timeSlot}`
        : 'urgent'

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          address: form.address,
          scheduledDate,
          description,
          paymentMethod: form.paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setBookingId(data.id)
      setPhase('done')
    } catch (e: unknown) {
      const err = e as Error
      alert(err.message ?? 'Error al crear la solicitud')
    } finally {
      setSubmitting(false)
    }
  }

  const totalSteps = steps.length + 1
  const currentProgress = phase === 'category' ? 0
    : phase === 'questions' ? stepIndex / totalSteps
    : phase === 'form' ? steps.length / totalSteps
    : 1

  return (
    <div className="flex-1 flex flex-col min-h-0 relative">

      {/* Header — sin fondo, transparente */}
      <div
        className="flex-shrink-0 px-4 pb-4"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 16px))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.push('/dashboard/client')}
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, backgroundColor: 'var(--bg-cards)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: 'var(--bg-cards)', color: 'var(--text-muted)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Ayuda general
          </button>
        </div>

        <div>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Nueva solicitud</p>
          <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text-dark)' }}>
            {selectedCategory?.name ?? 'Servicio a domicilio'}
          </h1>
        </div>

        {phase !== 'category' && (
          <div className="mt-3 rounded-full overflow-hidden" style={{ height: 3, backgroundColor: '#e5e7eb' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${currentProgress * 100}%`, backgroundColor: 'var(--primary-red)' }}
            />
          </div>
        )}
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        style={{ backgroundColor: 'var(--bg-body)' }}
      >
        {phase === 'category' && (
          <p className="text-xs text-center pb-1" style={{ color: 'var(--text-muted)' }}>
            Algunas preguntas para entender mejor tu problema:
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-2 ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.from === 'bot' ? (
              <div className="flex items-end gap-2 max-w-[80%]">
                <Image src="/icons/pensando.svg" alt="Bot" width={44} height={44} className="flex-shrink-0 mb-0.5" />
                <div
                  className="px-4 py-3 rounded-2xl rounded-bl-sm text-sm"
                  style={{ backgroundColor: 'var(--bg-cards)', color: 'var(--text-dark)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                >
                  {msg.text}
                </div>
              </div>
            ) : (
              <div
                className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm font-medium max-w-[75%]"
                style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
              >
                {msg.text}
              </div>
            )}

          </div>
        ))}

        {/* Form inline */}
        {phase === 'form' && (
          <div className="flex flex-col gap-3 mt-2">

            {/* Dirección */}
            <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-cards)' }}>
              <p className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>Dirección</p>
              {editingAddress ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: 'var(--bg-body)', border: '1.5px solid var(--primary-red)' }}>
                  <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, backgroundColor: 'var(--primary-red)' }}>
                    <MapPin size={15} color="white" />
                  </div>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    className="flex-1 text-sm outline-none bg-transparent"
                    style={{ color: 'var(--text-dark)' }}
                    autoFocus
                    onBlur={() => { if (form.address.trim()) setEditingAddress(false) }}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setEditingAddress(true)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-left"
                  style={{ backgroundColor: 'var(--bg-body)' }}
                >
                  <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, backgroundColor: 'var(--primary-red)' }}>
                    <MapPin size={15} color="white" />
                  </div>
                  <span className="flex-1 text-sm" style={{ color: 'var(--text-dark)' }}>{form.address || 'Ingresá tu dirección'}</span>
                  <ChevronRight size={16} color="var(--text-muted)" />
                </button>
              )}
            </div>

            {/* Fecha */}
            <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-cards)' }}>
              <p className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>Fecha</p>

              {/* Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setForm((f) => ({ ...f, dateMode: 'coordinate' }))}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full transition-all"
                  style={{ backgroundColor: form.dateMode === 'coordinate' ? 'var(--primary-red)' : 'var(--bg-body)', color: form.dateMode === 'coordinate' ? '#fff' : 'var(--text-dark)' }}
                >
                  <Calendar size={13} strokeWidth={2} />
                  <span className="text-sm font-bold">A coordinar</span>
                  <ChevronDown size={13} strokeWidth={2} />
                </button>
                <button
                  onClick={() => setForm((f) => ({ ...f, dateMode: 'urgent' }))}
                  className="flex-1 py-2.5 rounded-full text-sm font-bold transition-all"
                  style={{ backgroundColor: form.dateMode === 'urgent' ? 'var(--primary-red)' : 'var(--bg-body)', color: form.dateMode === 'urgent' ? '#fff' : 'var(--text-dark)' }}
                >
                  Urgente
                </button>
              </div>

              {form.dateMode === 'coordinate' && (
                <>
                  {/* Franjas horarias — una sola fila inline */}
                  <div className="flex items-center gap-4 px-1">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => setForm((f) => ({ ...f, timeSlot: slot.value }))}
                        className="flex items-center gap-1.5 transition-all"
                        style={{ opacity: form.timeSlot === slot.value ? 1 : 0.45 }}
                      >
                        <div className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, backgroundColor: slot.color }} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-dark)' }}>{slot.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Scroller de días */}
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                    {UPCOMING_DATES.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setForm((f) => ({ ...f, scheduledDate: d.value }))}
                        className="flex flex-col items-center flex-shrink-0 rounded-2xl py-2.5 transition-all"
                        style={{
                          minWidth: 54,
                          backgroundColor: form.scheduledDate === d.value ? 'var(--primary-red)' : 'var(--bg-body)',
                          color: form.scheduledDate === d.value ? '#fff' : 'var(--text-dark)',
                        }}
                      >
                        <span className="text-xl font-bold leading-none">{d.day}</span>
                        <span className="text-[10px] mt-1 font-medium" style={{ opacity: 0.8 }}>{d.dayName}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {form.dateMode === 'urgent' && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Un proveedor disponible hoy se pondrá en contacto a la brevedad.
                </p>
              )}
            </div>

            {/* Valor del servicio */}
            <div className="rounded-2xl px-4 py-3 flex flex-col gap-2" style={{ backgroundColor: 'var(--bg-cards)' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>Valor del servicio</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>$43,000</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Tasa de Urgencia</span>
                  <Info size={13} color="var(--text-muted)" />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>$15,000</span>
              </div>
            </div>

            {/* Método de pago */}
            <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: 'var(--bg-cards)' }}>
              <p className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>Método de pago</p>
              <div className="flex gap-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((f) => ({ ...f, paymentMethod: opt.value }))}
                    className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl transition-all"
                    style={{
                      backgroundColor: form.paymentMethod === opt.value ? 'var(--primary-red)' : 'var(--bg-body)',
                      color: form.paymentMethod === opt.value ? '#fff' : 'var(--text-dark)',
                    }}
                  >
                    <opt.Icon size={18} strokeWidth={1.8} />
                    <span className="text-sm font-bold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Continuar */}
            <button
              onClick={handleSubmit}
              disabled={!form.address.trim() || submitting}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-full text-sm font-bold transition-all"
              style={{ backgroundColor: form.address.trim() ? 'var(--primary-red)' : '#d1d5db', color: '#fff' }}
            >
              <span>{submitting ? 'Enviando...' : 'Continuar'}</span>
              {!submitting && <ChevronRight size={18} />}
            </button>
          </div>
        )}

      </div>

      {/* Chips fijas al fondo */}
      {activeChips.length > 0 && phase !== 'form' && phase !== 'done' && (
        <div
          className="flex-shrink-0 px-4 py-3 flex flex-wrap gap-2"
          style={{ backgroundColor: 'var(--bg-body)', borderTop: '1px solid rgba(0,0,0,0.06)' }}
        >
          {activeChips.map((chip) => (
            <button
              key={chip}
              onClick={() => phase === 'category' ? handleCategorySelect(chip) : handleChipSelect(chip)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Pantalla de éxito — overlay full screen */}
      {phase === 'done' && bookingId && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8"
          style={{ backgroundColor: 'var(--bg-body)', zIndex: 10 }}
        >
          <Image src="/icons/boton-happy.svg" alt="¡Listo!" width={160} height={160} />
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>¡Solicitud generada!</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Estamos buscando el proveedor ideal para vos.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => router.push(`/dashboard/client/bookings/${bookingId}`)}
              className="w-full py-4 rounded-full text-sm font-bold"
              style={{ backgroundColor: 'var(--primary-red)', color: '#fff' }}
            >
              Ver mi solicitud
            </button>
            <button
              onClick={() => router.push('/dashboard/client')}
              className="w-full py-3 rounded-full text-sm font-semibold"
              style={{ backgroundColor: 'var(--bg-cards)', color: 'var(--text-muted)' }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

      {/* Input libre */}
      {phase === 'questions' && steps[stepIndex]?.freeText && (
        <div
          className="flex-shrink-0 flex items-center gap-3 px-4 py-3"
          style={{ backgroundColor: 'var(--bg-cards)', borderTop: '1px solid #f0f0f0' }}
        >
          <input
            type="text"
            value={freeInput}
            onChange={(e) => setFreeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFreeSubmit()}
            placeholder="Escribí tu respuesta..."
            className="flex-1 text-sm outline-none bg-transparent"
            style={{ color: 'var(--text-dark)' }}
          />
          <button
            onClick={handleFreeSubmit}
            disabled={!freeInput.trim()}
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, backgroundColor: freeInput.trim() ? 'var(--primary-red)' : '#e5e7eb' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
