import { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  children: ReactNode
  className?: string
}

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  const variantClasses = `badge-${variant}`

  return (
    <span className={`badge ${variantClasses} ${className}`.trim()}>
      {children}
    </span>
  )
}
