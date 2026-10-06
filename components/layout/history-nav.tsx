'use client'

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HistoryNav() {
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        className="size-10"
        aria-label="뒤로가기"
        onClick={() => window.history.back()}
      >
        <ArrowLeftIcon />
      </Button>
      <Button
        type="button"
        variant="outline"
        className="size-10"
        aria-label="앞으로가기"
        onClick={() => window.history.forward()}
      >
        <ArrowRightIcon />
      </Button>
    </div>
  )
}
