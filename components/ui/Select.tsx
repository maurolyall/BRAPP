import { SelectHTMLAttributes } from 'react'

interface Option {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Option[]
}

export default function Select({ label, error, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-semibold" style={{ color: 'var(--text-dark)' }}>
          {label}
        </label>
      )}
      <select
        {...props}
        className={className}
        style={{
          backgroundColor: 'var(--bg-body)',
          color: 'var(--text-dark)',
          border: '1.5px solid #e5e7eb',
          borderRadius: 12,
          padding: '12px 40px 12px 16px',
          fontSize: 16,
          width: '100%',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 14px center',
          cursor: 'pointer',
          ...props.style,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--primary-red)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
