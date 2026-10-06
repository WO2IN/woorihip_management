import { WrenchIcon, Layers3Icon } from 'lucide-react'
import { getTempHumidityTargets, createTempHumidityTarget, deleteTempHumidityTarget } from '@/app/actions/temp-humidity'
import { SiteHeader } from '@/components/site-header'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { TargetCreateDialog } from '@/components/target-create-dialog'
import { TargetListRow } from '@/components/target-list-row'
import { formatFloorLabel, groupByFloor, detectFloor } from '@/lib/floor'

export default async function TempHumidityIndexPage({ searchParams }: { searchParams: Promise<{ floor?: string }> }) {
  const { floor: selectedFloor } = await searchParams
  const allTargets = await getTempHumidityTargets()
  const targetList = selectedFloor ? allTargets.filter((item) => detectFloor(item.floor, item.name) === selectedFloor) : allTargets

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader active="/checksheets/temp-humidity" />
      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">온/습도 체크시트</h1>
            <p className="text-sm text-muted-foreground">점검할 항목을 선택하세요.</p>
          </div>
          <TargetCreateDialog 
            title="온습도 측정 대상 추가"
            triggerText="온습도 추가"
            createAction={createTempHumidityTarget}
            redirectPathPrefix="/checksheets/temp-humidity"
          />
        </div>

        {targetList.length === 0 ? (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WrenchIcon />
              </EmptyMedia>
              <EmptyTitle>등록된 항목이 없습니다</EmptyTitle>
              <EmptyDescription>먼저 새로운 항목을 등록하세요.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <TargetCreateDialog 
                title="온습도 측정 대상 추가"
                triggerText="온습도 추가"
                createAction={createTempHumidityTarget}
                redirectPathPrefix="/checksheets/temp-humidity"
              />
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-6">
            {groupByFloor(targetList).filter(([floor]) => !selectedFloor || floor === selectedFloor).map(([floor, items]) => (
              <section key={floor} aria-labelledby={`temp-floor-${floor}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Layers3Icon className="size-5 text-primary" aria-hidden="true" />
                  <h2 id={`temp-floor-${floor}`} className="font-semibold">{formatFloorLabel(floor)}</h2>
                  <span className="text-sm text-muted-foreground">{items.length}개</span>
                </div>
                <div className="flex flex-col divide-y divide-border border border-border">
                  {items.map((item) => (
                    <TargetListRow
                      key={item.id}
                      href={`/checksheets/temp-humidity/${item.id}`}
                      name={item.name}
                      floor={item.floor || ''}
                      department={item.department}
                      manager={item.manager}
                      deleteTitle="이 항목을 삭제할까요?"
                      deleteDescription={`${item.name} 항목과 입력된 온/습도 점검 내용이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
                      deleteAction={deleteTempHumidityTarget}
                      id={item.id}
                    />
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
