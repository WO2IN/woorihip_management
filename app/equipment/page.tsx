import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { buttonVariants } from '@/components/ui/button'
import { FactoryIcon, PlusIcon, ClipboardCheckIcon, WrenchIcon, ThermometerIcon, ArrowRightIcon } from 'lucide-react'
import { getEquipmentList } from '@/app/actions/equipment'
import { getFiveSTargets } from '@/app/actions/five-s'
import { getTempHumidityTargets } from '@/app/actions/temp-humidity'
import { detectFloor } from '@/lib/floor'

export default async function EquipmentPage({ searchParams }: { searchParams: Promise<{ floor?: string }> }) {
  const { floor: selectedFloor } = await searchParams
  const [list, fiveSTargets, tempHumidityTargets] = await Promise.all([
    getEquipmentList(),
    getFiveSTargets(),
    getTempHumidityTargets(),
  ])
  const matchesFloor = (item: { floor?: string | null; name: string }) => !selectedFloor || detectFloor(item.floor, item.name) === selectedFloor
  const filteredList = list.filter(matchesFloor)
  const filteredFiveSTargets = fiveSTargets.filter(matchesFloor)
  const filteredTempHumidityTargets = tempHumidityTargets.filter(matchesFloor)
  const summaryCards = [
    { href: `/checksheets/5s?floor=${selectedFloor ?? ''}`, title: '3정 5S', description: '정리·정돈·청소·표준화 점검', count: filteredFiveSTargets.length, icon: ClipboardCheckIcon, tone: 'sky' },
    { href: `/checksheets/daily?floor=${selectedFloor ?? ''}`, title: '설비 일상점검', description: '설비별 일상 점검 항목과 기록', count: filteredList.length, icon: WrenchIcon, tone: 'amber' },
    { href: `/checksheets/temp-humidity?floor=${selectedFloor ?? ''}`, title: '온/습도', description: '온도·습도 측정 기록과 추이', count: filteredTempHumidityTargets.length, icon: ThermometerIcon, tone: 'violet' },
  ] as const
  return (
    <div className="min-h-screen">
      <SiteHeader active="/equipment" />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">설비 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedFloor ? `${selectedFloor}층 설비와 점검표를 관리합니다.` : '설비 정보와 점검표를 관리합니다.'}
            </p>
          </div>
          <Link href="/equipment/new" className={buttonVariants({ variant: 'default' })}>
            <PlusIcon data-icon="inline-start" />
            설비 등록
          </Link>
        </div>

        <section className="mb-8" aria-labelledby="checksheet-summary-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><ClipboardCheckIcon className="size-4" aria-hidden="true" /></span>
                <h2 id="checksheet-summary-heading" className="text-lg font-semibold">{selectedFloor ? `${selectedFloor}층 점검표` : '전체 점검표'}</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">점검표 종류별로 바로 확인할 수 있습니다.</p>
            </div>
            <span className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">총 {filteredFiveSTargets.length + filteredList.length + filteredTempHumidityTargets.length}개</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {summaryCards.map(({ href, title, description, count, icon: Icon, tone }) => (
              <Link key={title} href={href} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10">
                <span className={`absolute -right-10 -top-10 size-32 rounded-full opacity-20 transition-transform duration-300 group-hover:scale-125 ${tone === 'sky' ? 'bg-sky-400' : tone === 'amber' ? 'bg-amber-400' : 'bg-violet-400'}`} aria-hidden="true" />
                <span className="relative flex items-start justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
                  <ArrowRightIcon className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
                <span className="relative mt-6 flex items-end justify-between">
                  <span><span className="block text-sm font-medium text-muted-foreground">{title}</span><span className="mt-1 block text-3xl font-bold tracking-tight">{count}<span className="ml-1 text-base font-medium text-muted-foreground">개</span></span><span className="mt-2 block text-xs text-muted-foreground">{description}</span></span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {filteredList.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FactoryIcon />
              </EmptyMedia>
              <EmptyTitle>등록된 설비가 없습니다</EmptyTitle>
              <EmptyDescription>설비를 등록하면 층별 점검표에서 관리할 수 있습니다.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
      </main>
    </div>
  )
}
