import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 text-[var(--color-text-muted)]">
      <div className="w-14 h-14 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-3">
        <Icon size={24} />
      </div>
      <p className="font-medium text-[var(--color-text)]">{title}</p>
      {subtitle && <p className="text-sm mt-1 max-w-xs">{subtitle}</p>}
    </div>
  )
}
