import Link from 'next/link'
import { ClipboardCheckIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [{ href: '/', label: '대시보드' }]

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="no-print sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ClipboardCheckIcon className="size-5 text-primary" />
          <span className="hidden sm:inline">설비/품질 점검 관리</span>
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground',
                active === item.href && 'bg-secondary text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
