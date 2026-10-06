import { cn } from '@/lib/utils'
import type { TodayStatus } from '@/lib/today-check'

export function TodayStatusBadge({ status, label }: { status: TodayStatus; label: string }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'missing' && 'bg-amber-100 text-amber-800',
        status === 'done' && 'bg-emerald-100 text-emerald-800',
        status === 'off' && 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  )
}
