'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface RemarksFieldProps {
  defaultValue: string
  onSave: (value: string) => Promise<void>
  label?: string
}

export function RemarksField({ defaultValue, onSave, label = '특기사항' }: RemarksFieldProps) {
  const [value, setValue] = useState(defaultValue)

  return (
    <div className="print-remarks flex flex-col gap-1.5">
      <span className="print-compact-label text-sm font-medium">{label}</span>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onSave(value)}
        rows={3}
        className="print-compact-textarea resize-none"
      />
    </div>
  )
}
