import Link from 'next/link'
import { ClipboardCheckIcon } from 'lucide-react'
import { HistoryNav } from '@/components/layout/history-nav'

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ClipboardCheckIcon className="size-5 text-primary" />
          <span className="hidden sm:inline">설비/품질 점검 관리</span>
        </Link>
        <HistoryNav />
      </div>
    </header>
  )
}
