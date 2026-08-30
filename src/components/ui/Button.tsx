import type { ButtonHTMLAttributes } from 'react'
import { cx } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

export function Button({ variant = 'primary', fullWidth, className, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[15px] font-medium transition-colors active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<string, string> = {
    primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]',
    secondary: 'bg-[var(--color-surface-2)] text-[var(--color-text)] hover:bg-[var(--color-border)]',
    ghost: 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]',
    danger: 'bg-[var(--color-down-bg)] text-[var(--color-down)] hover:brightness-95',
  }
  return <button className={cx(base, variants[variant], fullWidth && 'w-full', className)} {...props} />
}
