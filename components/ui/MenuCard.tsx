import Link from 'next/link'
import { ReactNode } from 'react'

interface BaseProps {
  icon: ReactNode
  label: string
  variant?: 'default' | 'danger'
}

interface LinkProps extends BaseProps {
  href: string
  onClick?: never
}

interface ButtonProps extends BaseProps {
  onClick: () => void
  href?: never
}

type Props = LinkProps | ButtonProps

export default function MenuCard({ icon, label, variant = 'default', href, onClick }: Props) {
  const isDanger = variant === 'danger'

  const content = (
    <>
      <div className="flex items-center gap-3">
        <span style={{ color: isDanger ? 'white' : 'var(--text-dark)', flexShrink: 0, display: 'flex' }}>
          {icon}
        </span>
        <span className="font-semibold text-sm" style={{ color: isDanger ? 'white' : 'var(--text-dark)' }}>
          {label}
        </span>
      </div>
      {!isDanger && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </>
  )

  const sharedStyle: React.CSSProperties = {
    backgroundColor: isDanger ? 'var(--primary-red)' : 'var(--bg-cards)',
    borderRadius: '1.25rem',
    boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
    padding: '1.1rem 1.25rem',
  }

  if (href) {
    return (
      <Link href={href} className="flex items-center justify-between w-full" style={sharedStyle}>
        {content}
      </Link>
    )
  }

  return (
    <button onClick={onClick} className="flex items-center justify-between w-full text-left" style={sharedStyle}>
      {content}
    </button>
  )
}
