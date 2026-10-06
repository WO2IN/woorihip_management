import { Layers3Icon, WrenchIcon } from 'lucide-react'
import { getFiveSTargets, createFiveSTarget, deleteFiveSTarget } from '@/app/actions/five-s'
import { SiteHeader } from '@/components/layout/site-header'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { TargetCreateDialog } from '@/components/shared/target-create-dialog'
import { TargetListRow } from '@/components/shared/target-list-row'
import { formatFloorLabel, groupByFloor, detectFloor } from '@/lib/floor'
import { getTodayCheckStatuses } from '@/app/actions/today-status'
import { compareTodayStatus, todayStatusLabel } from '@/lib/today-check'

export default async function FiveSIndexPage({ searchParams }: { searchParams: Promise<{ floor?: string }> }) {
  const { floor: selectedFloor } = await searchParams
  const [allTargets, today] = await Promise.all([getFiveSTargets(), getTodayCheckStatuses()])
  const targetList = selectedFloor ? allTargets.filter((item) => detectFloor(item.floor, item.name) === selectedFloor) : allTargets

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">3정 5S Check Sheet</h1>
            <p className="text-sm text-muted-foreground">점검할 항목을 선택하세요.</p>
          </div>
          <TargetCreateDialog 
            title="3정 5S 대상 추가"
            triggerText="3정 5S 추가"
            createAction={createFiveSTarget}
            redirectPathPrefix="/checksheets/5s"
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
                title="3정 5S 대상 추가"
                triggerText="3정 5S 추가"
                createAction={createFiveSTarget}
                redirectPathPrefix="/checksheets/5s"
              />
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-6">
            {groupByFloor(targetList).filter(([floor]) => !selectedFloor || floor === selectedFloor).map(([floor, items]) => (
              <section key={floor} aria-labelledby={`five-s-floor-${floor}`}>
                <div className="mb-2 flex items-center gap-2">
                  <Layers3Icon className="size-5 text-primary" aria-hidden="true" />
                  <h2 id={`five-s-floor-${floor}`} className="font-semibold">{formatFloorLabel(floor)}</h2>
                  <span className="text-sm text-muted-foreground">{items.length}개</span>
                </div>
                <div className="flex flex-col divide-y divide-border border border-border">
                  {[...items]
                    .sort((a, b) => compareTodayStatus(today.fiveS[a.id] ?? 'off', today.fiveS[b.id] ?? 'off'))
                    .map((item) => {
                      const status = today.fiveS[item.id] ?? 'off'
                      return (
                        <TargetListRow
                          key={item.id}
                          href={`/checksheets/5s/${item.id}`}
                          name={item.name}
                          floor={item.floor || ''}
                          department={item.department}
                          manager={item.manager}
                          inspectorName={item.manager}
                          deleteTitle="이 항목을 삭제할까요?"
                          deleteDescription={`${item.name} 항목과 입력된 3정 5S 점검 내용이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
                          deleteAction={deleteFiveSTarget}
                          id={item.id}
                          status={status}
                          statusLabel={todayStatusLabel(status, today.weekend)}
                        />
                      )
                    })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
