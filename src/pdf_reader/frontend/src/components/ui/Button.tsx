import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseClasses = 'btn'
  const variantClasses = `btn-${variant}`
  const sizeClasses = `btn-${size}`
  const disabledClasses = disabled || isLoading ? 'disabled' : ''

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="spinner-sm" />}
      {children}
    </button>
  )
}
