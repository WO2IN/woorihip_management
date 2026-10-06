import {
  getOrCreateTempHumiditySheet,
  getTempHumidityEntries,
  updateTempHumiditySheetFields,
  getTempHumidityTargetById,
  updateTempHumidityTarget,
  toggleTempHumidityHoliday,
} from '@/app/actions/temp-humidity'
import { SiteHeader } from '@/components/layout/site-header'
import { YearMonthPicker } from '@/components/shared/year-month-picker'
import { ApprovalBox } from '@/components/shared/approval-box'
import { RemarksField } from '@/components/shared/remarks-field'
import { PrintButton } from '@/components/shared/print-button'
import { TempHumidityTable } from '@/components/checksheets/temp-humidity/temp-humidity-table'
import { TempHumidityChart } from '@/components/checksheets/temp-humidity/temp-humidity-chart'
import { currentYearMonth } from '@/lib/date-utils'
import { notFound } from 'next/navigation'
import { SheetHeaderEditor } from '@/components/shared/sheet-header-editor'

export default async function TempHumidityPage({
  params,
  searchParams,
}: {
  params: Promise<{ targetId: string }>
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const { targetId } = await params
  const tId = Number(targetId)
  const target = await getTempHumidityTargetById(tId)
  if (!target) notFound()

  const sp = await searchParams
  const { year: curYear, month: curMonth } = currentYearMonth()
  const year = sp.year ? Number(sp.year) : curYear
  const month = sp.month ? Number(sp.month) : curMonth

  const sheet = await getOrCreateTempHumiditySheet(tId, year, month)
  const entries = await getTempHumidityEntries(sheet.id)
  const holidays: number[] = (sheet as any).holidays ?? []

  const tempLower = target.tempLower ?? 10
  const tempUpper = target.tempUpper ?? 30
  const humidityLower = target.humidityLower ?? 0
  const humidityUpper = target.humidityUpper ?? 60
  const limitsLabel = `관리기준: 온도 ${tempLower}~${tempUpper}℃ (LCL ${tempLower} / UCL ${tempUpper}) · 습도 ${humidityLower}~${humidityUpper}% (LCL ${humidityLower} / UCL ${humidityUpper})`

  async function saveApproval(fields: { writer?: string; reviewer?: string; approver?: string }) {
    'use server'
    await updateTempHumiditySheetFields(sheet.id, fields)
  }

  async function saveRemarks(value: string) {
    'use server'
    await updateTempHumiditySheetFields(sheet.id, { remarks: value })
  }

  async function toggleHoliday(day: number) {
    'use server'
    await toggleTempHumidityHoliday(sheet.id, day)
  }

  return (
    <div className="temp-humidity-page min-h-dvh bg-background">
      <SiteHeader />
      <main className="print-page mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-6 sm:px-6">
        <div className="no-print flex flex-wrap items-center justify-between gap-3">
          <YearMonthPicker year={year} month={month} />
          <PrintButton />
        </div>

        <div className="print-compact-box flex flex-wrap items-start justify-between gap-4 border border-border bg-card p-4">
          <div className="flex flex-1 items-start gap-3">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%ED%9A%8C%EC%82%AC%EB%A1%9C%EA%B3%A0_%ED%88%AC%EB%AA%85-kdSjzuFUF1A1rzO914B2j1jjYSWH4Z.png"
              alt="WOORI 로고"
              className="print-logo h-12 w-auto object-contain"
            />
            <div className="flex flex-col gap-1">
              <h1 className="text-balance text-xl font-semibold flex items-center">
                {year}년 {month}월 온/습도 체크시트
                <SheetHeaderEditor
                  id={tId}
                  name={target.name}
                  floor={target.floor || ''}
                  department={target.department || ''}
                  manager={target.manager || ''}
                  standard={target.standard || '관리기준: 온도 20±10℃ · 습도 60% 이하'}
                  updateAction={updateTempHumidityTarget}
                  showStandard={true}
                  numberFields={[
                    { key: 'tempLower', label: '온도 하한선(LCL, ℃)', defaultValue: target.tempLower ?? 10 },
                    { key: 'tempUpper', label: '온도 상한선(UCL, ℃)', defaultValue: target.tempUpper ?? 30 },
                    { key: 'humidityLower', label: '습도 하한선(LCL, %)', defaultValue: target.humidityLower ?? 0 },
                    { key: 'humidityUpper', label: '습도 상한선(UCL, %)', defaultValue: target.humidityUpper ?? 60 },
                  ]}
                />
              </h1>
              <p className="text-sm text-muted-foreground">
                점검부서: {target.department || '-'} · 담당자: {target.manager || '-'} · 항목명: {target.name}
              </p>
              <p className="text-sm text-muted-foreground">{target.standard || limitsLabel}</p>
            </div>
          </div>
          <ApprovalBox
            writer={sheet.writer}
            reviewer={sheet.reviewer}
            approver={sheet.approver}
            onSave={saveApproval}
          />
        </div>

        <div className="temp-humidity-body flex min-h-0 flex-1 flex-col gap-4">
          <TempHumidityChart
            year={year}
            month={month}
            entries={entries}
            tempLower={tempLower}
            tempUpper={tempUpper}
            humidityLower={humidityLower}
            humidityUpper={humidityUpper}
          />
          <TempHumidityTable
            sheetId={sheet.id}
            year={year}
            month={month}
            entries={entries}
            manager={target.manager || ''}
            holidays={holidays}
            workdays={(sheet as any).workdays ?? []}
            onToggleHoliday={toggleHoliday}
          />
        </div>

        <div className="print-compact-box border border-border bg-card p-4">
          <RemarksField defaultValue={sheet.remarks ?? ''} onSave={saveRemarks} />
        </div>
      </main>
    </div>
  )
}
