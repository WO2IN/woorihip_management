'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRightIcon, Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { formatFloorLabel } from '@/lib/floor'
import { TodayStatusBadge } from '@/components/shared/today-status-badge'
import type { TodayStatus } from '@/lib/today-check'

interface TargetListRowProps {
  href: string
  name: string
  floor?: string | null
  department?: string | null
  manager?: string | null
  inspectorName?: string | null
  deleteTitle: string
  deleteDescription: string
  deleteAction: (id: number) => Promise<void>
  id: number
  status?: TodayStatus
  statusLabel?: string
}

export function TargetListRow({
  href,
  name,
  floor,
  department,
  manager,
  inspectorName,
  deleteTitle,
  deleteDescription,
  deleteAction,
  id,
  status,
  statusLabel,
}: TargetListRowProps) {
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    setPending(true)
    try {
      await deleteAction(id)
      toast.success('삭제되었습니다.')
    } catch (error) {
      console.error('[v0] delete target error:', error)
      toast.error('삭제에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex items-center gap-2 bg-card transition-colors hover:bg-accent/20">
      <Link href={href} className="flex min-w-0 flex-1 items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium">{name}</span>
          <span className="truncate text-sm text-muted-foreground">
            {formatFloorLabel(floor, name)} · {department || '부서 미지정'}
            {inspectorName ? (
              <>
                {' · '}
                <span className="font-semibold text-primary">점검자 {inspectorName}</span>
              </>
            ) : (
              <> · {manager || '담당자 미지정'}</>
            )}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {status && statusLabel ? <TodayStatusBadge status={status} label={statusLabel} /> : null}
          <ChevronRightIcon className="size-4 text-muted-foreground" />
        </span>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mr-3 shrink-0 text-muted-foreground hover:text-destructive"
            />
          }
        >
          <Trash2Icon />
          <span className="sr-only">{name} 삭제</span>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={pending}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
