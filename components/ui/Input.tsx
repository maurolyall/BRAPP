import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
          {label}
        </label>
      )}
      <input
        {...props}
        className={`input-base ${error ? 'border-red-400' : ''} ${className}`}
      />
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--primary-red)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
