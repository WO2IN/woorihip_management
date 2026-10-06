import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { EquipmentCard } from '@/components/equipment-card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { buttonVariants } from '@/components/ui/button'
import { FactoryIcon, PlusIcon, Layers3Icon } from 'lucide-react'
import { getEquipmentList } from '@/app/actions/equipment'
import { formatFloorLabel, groupByFloor } from '@/lib/floor'

export default async function EquipmentPage() {
  const list = await getEquipmentList()
  const floors = new Map<string, typeof list>()
  for (const item of list) {
    const detectedFloor = item.floor || item.name.match(/(\d+)층/)?.[1] || '미지정'
    const floorItems = floors.get(detectedFloor) ?? []
    floorItems.push(item)
    floors.set(detectedFloor, floorItems)
  }
  const floorEntries = [...floors.entries()].sort(([a], [b]) => {
    if (a === '미지정') return 1
    if (b === '미지정') return -1
    return Number(a) - Number(b)
  })

  return (
    <div className="min-h-screen">
      <SiteHeader active="/equipment" />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">설비 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              설비 정보와 사진, 일상점검 항목 템플릿을 관리합니다.
            </p>
          </div>
          <Link href="/equipment/new" className={buttonVariants({ variant: 'default' })}>
            <PlusIcon data-icon="inline-start" />
            설비 등록
          </Link>
        </div>

        {list.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FactoryIcon />
              </EmptyMedia>
              <EmptyTitle>등록된 설비가 없습니다</EmptyTitle>
              <EmptyDescription>설비를 등록하면 일상점검 체크시트를 작성할 수 있습니다.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="space-y-8">
            {floorEntries.map(([floor, items]) => (
              <section key={floor} aria-labelledby={`floor-${floor}`}>
                <div className="mb-3 flex items-center gap-2">
                  <Layers3Icon className="size-5 text-primary" aria-hidden="true" />
                  <h2 id={`floor-${floor}`} className="text-lg font-semibold">
                    {floor === '미지정' ? '층 미지정' : `${floor}층`}
                  </h2>
                  <span className="text-sm text-muted-foreground">{items.length}개</span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <EquipmentCard key={item.id} equipment={{ ...item, floor: item.floor || (item.name.match(/(\\d+)층/)?.[1] ?? null) }} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
