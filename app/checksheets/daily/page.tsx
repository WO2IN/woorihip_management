import { WrenchIcon, Layers3Icon } from 'lucide-react'
import { getEquipmentList, deleteEquipment, createEquipment } from '@/app/actions/equipment'
import { SiteHeader } from '@/components/layout/site-header'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '@/components/ui/empty'
import { TargetCreateDialog } from '@/components/shared/target-create-dialog'
import { TargetListRow } from '@/components/shared/target-list-row'
import { formatFloorLabel, groupByFloor, detectFloor } from '@/lib/floor'
import { getTodayCheckStatuses } from '@/app/actions/today-status'
import { compareTodayStatus, todayStatusLabel } from '@/lib/today-check'

export default async function DailyCheckIndexPage({ searchParams }: { searchParams: Promise<{ floor?: string }> }) {
  const { floor: selectedFloor } = await searchParams
  const [allEquipment, today] = await Promise.all([getEquipmentList(), getTodayCheckStatuses()])
  const equipmentList = selectedFloor
    ? allEquipment.filter((item) => detectFloor(item.floor, item.name) === selectedFloor)
    : allEquipment

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">설비 일상점검 체크시트</h1>
            <p className="text-sm text-muted-foreground">점검할 설비를 선택하세요.</p>
          </div>
          <TargetCreateDialog
            title="설비 추가"
            triggerText="설비 추가"
            createAction={createEquipment}
            redirectPathPrefix="/checksheets/daily"
          />
        </div>

        {equipmentList.length === 0 ? (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WrenchIcon />
              </EmptyMedia>
              <EmptyTitle>등록된 설비가 없습니다</EmptyTitle>
              <EmptyDescription>먼저 새로운 설비를 등록하세요.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <TargetCreateDialog
                title="설비 추가"
                triggerText="설비 추가하기"
                createAction={createEquipment}
                redirectPathPrefix="/checksheets/daily"
              />
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-6">
            {groupByFloor(equipmentList)
              .filter(([floor]) => !selectedFloor || floor === selectedFloor)
              .map(([floor, items]) => (
                <section key={floor} aria-labelledby={`daily-floor-${floor}`}>
                  <div className="mb-2 flex items-center gap-2">
                    <Layers3Icon className="size-5 text-primary" aria-hidden="true" />
                    <h2 id={`daily-floor-${floor}`} className="font-semibold">
                      {formatFloorLabel(floor)}
                    </h2>
                    <span className="text-sm text-muted-foreground">{items.length}개</span>
                  </div>
                  <div className="flex flex-col divide-y divide-border border border-border">
                    {[...items]
                      .sort((a, b) => compareTodayStatus(today.daily[a.id] ?? 'off', today.daily[b.id] ?? 'off'))
                      .map((item) => {
                        const status = today.daily[item.id] ?? 'off'
                        return (
                          <TargetListRow
                            key={item.id}
                            href={`/checksheets/daily/${item.id}`}
                            name={item.name}
                            floor={item.floor || ''}
                            department={item.department}
                            manager={item.manager}
                            inspectorName={item.inspectorName}
                            deleteTitle="이 설비를 삭제할까요?"
                            deleteDescription={`${item.name} 설비와 연관된 사진, 점검항목, 일상점검 내용이 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`}
                            deleteAction={deleteEquipment}
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
