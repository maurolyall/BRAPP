import Link from 'next/link'

interface Props {
  href: string
}

export default function BackButton({ href }: Props) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
      style={{ backgroundColor: 'var(--bg-cards)' }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-dark)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </Link>
  )
}
