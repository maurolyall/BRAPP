import Link from 'next/link'
import Image from 'next/image'

interface PublicHeaderProps {
  logoHref?: string
}

export default function PublicHeader({ logoHref = '/' }: PublicHeaderProps) {
  return (
    <header
      className="pt-10 pb-6 text-center"
      style={{
        backgroundColor: 'var(--bg-cards)',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px',
      }}
    >
      <Link href={logoHref}>
        <Image src="/logo.svg" alt="Botón Rojo" width={150} height={45} priority className="mx-auto" style={{ height: 'auto' }} />
      </Link>
    </header>
  )
}
