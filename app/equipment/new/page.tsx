'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'
import { toast } from 'sonner'
import { SiteHeader } from '@/components/site-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PhotoStageUploader } from '@/components/photo-stage-uploader'
import { CheckItemEditor, type DraftCheckItem } from '@/components/check-item-editor'
import { InspectorManagerFields, EMPTY_INSPECTOR_MANAGER_VALUE, type InspectorManagerValue } from '@/components/inspector-manager-fields'
import { EmergencyFlowTable } from '@/components/emergency-flow-table'
import { FLOOR_OPTIONS } from '@/lib/floor'
import {
  createEquipment,
  addEquipmentPhoto,
  createDailyCheckItem,
  createEquipmentEmergencyGuide,
  createEquipmentEmergencyHistory,
} from '@/app/actions/equipment'

const OVERVIEW_LABEL = '전체 전경'
const PART_LABELS = ['1', '2', '3', '4', '5', '6', '7']

interface DraftEmergencyGuide {
  id: number
  emergencyType?: string
  emergencyAction?: string
}

interface DraftEmergencyHistory {
  id: number
  occurredDate?: string
  cause?: string
  action?: string
  processedDate?: string
  note?: string
}

export default function NewEquipmentPage() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const [basic, setBasic] = useState({ name: '', floor: '', department: '', manager: '' })
  const [overviewPhoto, setOverviewPhoto] = useState<File | null>(null)
  const [partPhotos, setPartPhotos] = useState<Record<string, File | null>>({})
  const [checkItems, setCheckItems] = useState<DraftCheckItem[]>([])
  const [inspectorManager, setInspectorManager] = useState<InspectorManagerValue>(EMPTY_INSPECTOR_MANAGER_VALUE)
  const [emergencyGuides, setEmergencyGuides] = useState<DraftEmergencyGuide[]>([])
  const [emergencyHistories, setEmergencyHistories] = useState<DraftEmergencyHistory[]>([])
  const [escalationNote, setEscalationNote] = useState('')

  async function uploadFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    if (!res.ok) throw new Error('upload failed')
    const { url } = await res.json()
    return url as string
  }

  async function handleSubmit() {
    if (!basic.name.trim()) {
      toast.error('설비명을 입력해주세요.')
      return
    }
    setPending(true)
    try {
      const created = await createEquipment({
        name: basic.name,
        floor: basic.floor,
        department: basic.department,
        manager: basic.manager,
        inspectorName: inspectorManager.inspectorName,
        inspectorDesc: inspectorManager.inspectorDesc,
        inspectorCycle: inspectorManager.inspectorCycle,
        managerName: inspectorManager.managerName,
        managerDesc: inspectorManager.managerDesc,
        managerCycle: inspectorManager.managerCycle,
        escalationNote,
      })
      if (!created) throw new Error('create failed')

      if (overviewPhoto) {
        const url = await uploadFile(overviewPhoto)
        await addEquipmentPhoto(created.id, url, OVERVIEW_LABEL)
      }
      for (const label of PART_LABELS) {
        const file = partPhotos[label]
        if (file) {
          const url = await uploadFile(file)
          await addEquipmentPhoto(created.id, url, label)
        }
      }

      for (let i = 0; i < checkItems.length; i++) {
        const item = checkItems[i]
        await createDailyCheckItem(created.id, {
          itemNo: i + 1,
          content: item.content,
          method: item.method,
          cycle: item.cycle,
        })
      }

      for (let i = 0; i < emergencyGuides.length; i++) {
        const row = emergencyGuides[i]
        await createEquipmentEmergencyGuide(created.id, { ...row, sortOrder: i })
      }
      for (let i = 0; i < emergencyHistories.length; i++) {
        const row = emergencyHistories[i]
        await createEquipmentEmergencyHistory(created.id, { ...row, sortOrder: i })
      }

      toast.success('설비가 등록되었습니다.')
      router.refresh()
      router.push(`/equipment/${created.id}`)
    } catch (error) {
      console.error('[v0] create equipment error:', error)
      toast.error('설비 등록에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader active="/equipment" />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <Link href="/equipment" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeftIcon className="size-3.5" />
          설비 목록
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">신규 설비 등록</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            설비 정보를 입력하고 등록 버튼을 누르면 저장됩니다.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Field>
                  <FieldLabel htmlFor="name">설비명</FieldLabel>
                  <Input
                    id="name"
                    value={basic.name}
                    onChange={(e) => setBasic((f) => ({ ...f, name: e.target.value }))}
                    placeholder="예: 3층 도금라인 도금조"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="floor">층</FieldLabel>
                  <Input
                    id="floor"
                    value={basic.floor}
                    onChange={(e) => setBasic((f) => ({ ...f, floor: e.target.value.replace(/[^0-9]/g, '') }))}
                    placeholder="예: 3"
                    inputMode="numeric"
                  />
                  <Select value={basic.floor ?? null} onValueChange={(value) => setBasic((f) => ({ ...f, floor: value ?? '' }))}>
                    <SelectTrigger id="floor" className="w-full">
                      <SelectValue placeholder="층을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                    {FLOOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="department">점검부서</FieldLabel>
                  <Input
                    id="department"
                    value={basic.department}
                    onChange={(e) => setBasic((f) => ({ ...f, department: e.target.value }))}
                    placeholder="예: 생산팀"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="manager">담당자</FieldLabel>
                  <Input
                    id="manager"
                    value={basic.manager}
                    onChange={(e) => setBasic((f) => ({ ...f, manager: e.target.value }))}
                    placeholder="예: 우데스 과장"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>설비 사진</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <PhotoStageUploader label={OVERVIEW_LABEL} file={overviewPhoto} onChange={setOverviewPhoto} size="large" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                {PART_LABELS.map((label) => (
                  <PhotoStageUploader
                    key={label}
                    label={label}
                    file={partPhotos[label] ?? null}
                    onChange={(file) => setPartPhotos((p) => ({ ...p, [label]: file }))}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>일상점검 항목 템플릿</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <CheckItemEditor items={checkItems} onChange={setCheckItems} />

              <InspectorManagerFields value={inspectorManager} onChange={setInspectorManager} />

              <EmergencyFlowTable
                guides={emergencyGuides}
                histories={emergencyHistories}
                onAddGuide={async () => {
                  setEmergencyGuides((rows) => [...rows, { id: Date.now() }])
                }}
                onUpdateGuide={async (id, fields) => {
                  setEmergencyGuides((rows) => rows.map((row) => (row.id === id ? { ...row, ...fields } : row)))
                }}
                onDeleteGuide={async (id) => {
                  setEmergencyGuides((rows) => rows.filter((row) => row.id !== id))
                }}
                onAddHistory={async () => {
                  setEmergencyHistories((rows) => [...rows, { id: Date.now() }])
                }}
                onUpdateHistory={async (id, fields) => {
                  setEmergencyHistories((rows) => rows.map((row) => (row.id === id ? { ...row, ...fields } : row)))
                }}
                onDeleteHistory={async (id) => {
                  setEmergencyHistories((rows) => rows.filter((row) => row.id !== id))
                }}
                escalationNote={escalationNote}
                onEscalationChange={setEscalationNote}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={pending} size="lg">
              {pending ? '등록 중...' : '등록'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
