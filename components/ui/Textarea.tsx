import { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export default function Textarea({ label, error, hint, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        className={`w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none ${className}`}
        style={{
          backgroundColor: 'var(--bg-body)',
          color: 'var(--text-dark)',
          border: '1.5px solid #e5e7eb',
          ...props.style,
        }}
      />
      {hint && (
        <span className="text-xs text-right" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </span>
      )}
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--primary-red)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
