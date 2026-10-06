import Link from 'next/link'
import { ArrowRightIcon, Building2Icon } from 'lucide-react'
import { getDashboardSummary } from '@/app/actions/dashboard'
import { SiteHeader } from '@/components/site-header'
import { currentYearMonth } from '@/lib/date-utils'

export default async function DashboardPage() {
  const { year, month } = currentYearMonth()
  const { equipmentCount } = await getDashboardSummary()
  const floorShortcuts = ['1', '2', '3']

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader active="/" />
      <main className="mx-auto flex max-w-[1400px] flex-col gap-8 px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">설비/품질 점검 관리시스템</h1>
          <p className="text-sm text-muted-foreground">
            {year}년 {month}월 · 등록된 설비 {equipmentCount}대
          </p>
        </div>

        <section className="flex flex-col gap-3" aria-labelledby="floor-shortcuts-heading">
          <div>
            <h2 id="floor-shortcuts-heading" className="text-lg font-semibold">층별 바로가기</h2>
            <p className="mt-1 text-sm text-muted-foreground">확인할 층을 선택해 설비 목록으로 이동합니다.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {floorShortcuts.map((floor, index) => (
              <Link
                key={floor}
                href={`/equipment?floor=${floor}`}
                className="group relative isolate min-h-40 overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg hover:shadow-primary/10"
              >
                <span className="absolute -right-8 -top-8 -z-10 size-32 rounded-full bg-primary/5 transition-transform duration-300 group-hover:scale-150" aria-hidden="true" />
                <span className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                    <Building2Icon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="flex size-8 items-center justify-center rounded-full border border-border bg-background/70 text-xs font-bold text-muted-foreground">
                    0{index + 1}
                  </span>
                </span>
                <span className="mt-7 flex items-end justify-between">
                  <span>
                    <span className="block text-xl font-bold tracking-tight">{floor}층</span>
                    <span className="mt-1 block text-sm text-muted-foreground">설비 점검 현황 보기</span>
                  </span>
                  <ArrowRightIcon className="mb-1 size-5 text-primary transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
