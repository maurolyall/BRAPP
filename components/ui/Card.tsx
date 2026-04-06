import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export default function Card({ children, className = '', style, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={`card ${className}`}
      style={{ ...style }}
    >
      {children}
    </div>
  )
}
