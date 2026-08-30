import { cx } from '../../lib/utils'

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'up' | 'down' | 'warn' }) {
  const tones: Record<string, string> = {
    neutral: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
    up: 'bg-[var(--color-up-bg)] text-[var(--color-up)]',
    down: 'bg-[var(--color-down-bg)] text-[var(--color-down)]',
    warn: 'bg-[var(--color-warn-bg)] text-[var(--color-warn)]',
  }
  return <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>
}
