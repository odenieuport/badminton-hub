import { Loader2 } from 'lucide-react'
import { cx } from '../../lib/utils'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx('animate-spin text-[var(--color-text-muted)]', className)} size={20} />
}
