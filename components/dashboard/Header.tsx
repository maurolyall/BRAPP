interface HeaderProps {
  user: {
    email: string
    name: string
  }
}

export default function Header({ user }: HeaderProps) {
  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
    : user.email[0].toUpperCase()

  return (
    <header
      className="flex items-center justify-between px-6 py-4"
      style={{ backgroundColor: 'var(--bg-cards)', borderBottom: '1px solid #f0f0f0' }}
    >
      <div />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold">{user.name || 'Usuario'}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: 'var(--primary-red)' }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
