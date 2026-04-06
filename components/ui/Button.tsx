import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all cursor-pointer active:scale-[0.97]'

  const variants = {
    primary: 'text-white border-none',
    secondary: 'border font-semibold',
    ghost: 'font-semibold border-none',
  }

  const sizes = {
    sm: 'text-xs px-4 py-2',
    md: 'text-sm px-6 py-3',
    lg: 'text-base px-8 py-4',
  }

  const styles: React.CSSProperties =
    variant === 'primary'
      ? { backgroundColor: 'var(--primary-red)' }
      : variant === 'secondary'
      ? { borderColor: '#d0d0d0', color: 'var(--text-dark)', backgroundColor: 'var(--bg-cards)' }
      : { color: 'var(--text-muted)', backgroundColor: 'transparent' }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{ ...styles, opacity: disabled || loading ? 0.6 : 1, ...props.style }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <>
          <span
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
          Cargando...
        </>
      ) : children}
    </button>
  )
}
