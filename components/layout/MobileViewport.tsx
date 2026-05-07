'use client'

import { usePathname } from 'next/navigation'

export default function MobileViewport({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')

  if (isAdmin) return <>{children}</>

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>
      <div
        className="relative mx-auto min-h-screen"
        style={{ maxWidth: '430px', backgroundColor: 'var(--bg-body)' }}
      >
        {children}
      </div>
    </div>
  )
}
