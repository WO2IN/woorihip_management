'use client'

import { useState } from 'react'
import { Trash2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ItemDeleteButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [armed, setArmed] = useState(false)

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else {
          setArmed(true)
        }
      }}
      onBlur={() => setArmed(false)}
      aria-label={armed ? '삭제 확인' : '삭제'}
      className={cn(
        'flex h-10 shrink-0 items-center justify-center gap-1 rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-50',
        armed
          ? 'border-destructive bg-destructive text-white'
          : 'border-border bg-card text-destructive hover:bg-destructive/10',
      )}
    >
      <Trash2Icon className="size-4" aria-hidden="true" />
      {armed ? '삭제 확인' : <span className="sr-only sm:not-sr-only">삭제</span>}
    </button>
  )
}
