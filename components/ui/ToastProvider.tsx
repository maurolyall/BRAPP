'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const SESSION_KEY = 'br_pending_toast'

type ToastType = 'success' | 'error'

interface ToastState {
  message: string
  type: ToastType
}

interface ToastCtx {
  show: (message: string, type?: ToastType) => void
  schedule: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastCtx>({ show: () => {}, schedule: () => {} })
export const useToast = () => useContext(ToastContext)

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [toast, setToast] = useState<ToastState | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const pending = sessionStorage.getItem(SESSION_KEY)
    if (pending) {
      sessionStorage.removeItem(SESSION_KEY)
      try {
        setToast(JSON.parse(pending))
      } catch {}
    }
  }, [pathname])

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const hide = setTimeout(() => setVisible(false), 3200)
    const clear = setTimeout(() => setToast(null), 3600)
    return () => { clearTimeout(hide); clearTimeout(clear) }
  }, [toast])

  const show = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type })
  }, [])

  const schedule = useCallback((message: string, type: ToastType = 'success') => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ message, type }))
  }, [])

  return (
    <ToastContext.Provider value={{ show, schedule }}>
      {children}
      {toast && (
        <div
          className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all duration-300"
          style={{
            backgroundColor: toast.type === 'success' ? '#111827' : 'var(--primary-red)',
            color: 'white',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            maxWidth: 420,
            margin: '0 auto',
          }}
        >
          {toast.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}
