"use server"

import { revalidatePath } from "next/cache"
import { findOne, insertRow, removeWhere, selectWhere, updateById, updateWhere } from "@/lib/local-store"
import { isDayOffDate, isWeekend, scheduledDaysForCycle } from "@/lib/date-utils"

function revalidateDaily() {
  revalidatePath("/checksheets/daily")
  revalidatePath("/checksheets/daily/[equipmentId]", "layout")
}

export async function getOrCreateDailyCheckSheet(equipmentId: number, year: number, month: number) {
  const existing = findOne(
    "dailyCheckSheets",
    (s: any) => s.equipmentId === equipmentId && s.year === year && s.month === month,
  )
  if (existing) return existing

  const equip = findOne("equipment", (e: any) => e.id === equipmentId)
  return insertRow("dailyCheckSheets", {
    equipmentId,
    year,
    month,
    department: (equip as any)?.department ?? null,
    manager: (equip as any)?.manager ?? null,
    writer: null,
    reviewer: null,
    approver: null,
    createdAt: new Date().toISOString(),
  })
}

export async function getDailyCheckEntries(sheetId: number) {
  return selectWhere("dailyCheckEntries", (e: any) => e.sheetId === sheetId)
}

export async function upsertDailyCheckEntry(sheetId: number, itemId: number, day: number, value: string) {
  const existing = findOne(
    "dailyCheckEntries",
    (e: any) => e.sheetId === sheetId && e.itemId === itemId && e.day === day,
  )

  if (existing) {
    updateById("dailyCheckEntries", (existing as any).id, { value })
  } else {
    insertRow("dailyCheckEntries", { sheetId, itemId, day, value })
  }
  revalidateDaily()
}

export async function bulkFillDailyCheckEntries(
  sheetId: number,
  year: number,
  month: number,
  uptoDay: number,
  symbol: string,
  items: { id: number; cycle?: string | null }[],
  fromDay = 1,
) {
  const sheet = findOne<any>("dailyCheckSheets", (s: any) => s.id === sheetId)
  const holidays: number[] = sheet?.holidays ?? []
  const workdays: number[] = sheet?.workdays ?? []
  const isDayOff = (day: number) => isDayOffDate(year, month, day, holidays, workdays)
  const startDay = Math.max(1, fromDay)

  for (const item of items) {
    const scheduled = new Set(scheduledDaysForCycle(year, month, startDay, uptoDay, item.cycle || "일", isDayOff))
    for (const day of scheduled) {
      const existing = findOne(
        "dailyCheckEntries",
        (e: any) => e.sheetId === sheetId && e.itemId === item.id && e.day === day,
      )
      if (!existing || !(existing as any).value) {
        if (existing) {
          updateById("dailyCheckEntries", (existing as any).id, { value: symbol })
        } else {
          insertRow("dailyCheckEntries", { sheetId, itemId: item.id, day, value: symbol })
        }
      }
    }
  }
  revalidateDaily()
}

export async function toggleDailyCheckMark(sheetId: number, role: "inspector" | "manager", day: number) {
  const sheet = findOne<any>("dailyCheckSheets", (s: any) => s.id === sheetId)
  if (!sheet) return
  const field = role === "inspector" ? "inspectorMarks" : "managerMarks"
  const current: number[] = sheet[field] ?? []
  const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day].sort((a, b) => a - b)
  updateById("dailyCheckSheets", sheetId, { [field]: next })
  revalidateDaily()
  return next
}

export async function fillDailyCheckMarks(
  sheetId: number,
  year: number,
  month: number,
  fromDay: number,
  toDay: number,
  inspectorCycle = "1회/일",
  managerCycle = "1회/주",
) {
  const sheet = findOne<any>("dailyCheckSheets", (s: any) => s.id === sheetId)
  if (!sheet) return
  const holidays: number[] = sheet.holidays ?? []
  const workdays: number[] = sheet.workdays ?? []
  const isDayOff = (day: number) => isDayOffDate(year, month, day, holidays, workdays)
  const inspectorDays = scheduledDaysForCycle(year, month, fromDay, toDay, inspectorCycle || "1회/일", isDayOff)
  const managerDays = scheduledDaysForCycle(year, month, fromDay, toDay, managerCycle || "1회/주", isDayOff)
  const inspectorMarks = Array.from(new Set([...(sheet.inspectorMarks ?? []), ...inspectorDays])).sort((a, b) => a - b)
  const managerMarks = Array.from(new Set([...(sheet.managerMarks ?? []), ...managerDays])).sort((a, b) => a - b)
  updateById("dailyCheckSheets", sheetId, { inspectorMarks, managerMarks })
  revalidateDaily()
}

export async function clearDailyCheckSheetEntries(sheetId: number) {
  removeWhere("dailyCheckEntries", (e: any) => e.sheetId === sheetId)
  updateById("dailyCheckSheets", sheetId, { inspectorMarks: [], managerMarks: [] })
  revalidateDaily()
}

export async function updateDailyCheckSheetFields(
  sheetId: number,
  fields: { department?: string; manager?: string; writer?: string; reviewer?: string; approver?: string },
) {
  updateById("dailyCheckSheets", sheetId, fields)
  revalidateDaily()
}

export async function toggleDailyCheckHoliday(sheetId: number, day: number) {
  const sheet = findOne<any>("dailyCheckSheets", (s: any) => s.id === sheetId)
  if (!sheet) return []
  if (isWeekend(sheet.year, sheet.month, day)) {
    const current: number[] = sheet.workdays ?? []
    const opening = !current.includes(day)
    const next = opening ? [...current, day].sort((a, b) => a - b) : current.filter((d) => d !== day)
    const patch: Record<string, unknown> = { workdays: next }
    if (!opening) {
      removeWhere("dailyCheckEntries", (e: any) => e.sheetId === sheetId && e.day === day)
      patch.inspectorMarks = (sheet.inspectorMarks ?? []).filter((d: number) => d !== day)
      patch.managerMarks = (sheet.managerMarks ?? []).filter((d: number) => d !== day)
    }
    updateById("dailyCheckSheets", sheetId, patch)
    revalidateDaily()
    return next
  }
  const current: number[] = sheet.holidays ?? []
  const adding = !current.includes(day)
  const next = adding ? [...current, day].sort((a, b) => a - b) : current.filter((d) => d !== day)
  const patch: Record<string, unknown> = { holidays: next }
  if (adding) {
    removeWhere("dailyCheckEntries", (e: any) => e.sheetId === sheetId && e.day === day)
    patch.inspectorMarks = (sheet.inspectorMarks ?? []).filter((d: number) => d !== day)
    patch.managerMarks = (sheet.managerMarks ?? []).filter((d: number) => d !== day)
  }
  updateById("dailyCheckSheets", sheetId, patch)
  revalidateDaily()
  return next
}

export async function getDailyCheckIssues(sheetId: number) {
  return selectWhere("dailyCheckIssues", (i: any) => i.sheetId === sheetId).sort((a: any, b: any) => a.id - b.id)
}

export async function addDailyCheckIssue(sheetId: number) {
  insertRow("dailyCheckIssues", {
    sheetId,
    occurredDate: null,
    cause: null,
    action: null,
    processedDate: null,
    note: null,
    createdAt: new Date().toISOString(),
  })
  revalidatePath("/checksheets/daily")
  revalidatePath("/checksheets/daily/[equipmentId]", "layout")
}

export async function updateDailyCheckIssue(
  id: number,
  fields: { occurredDate?: string; cause?: string; action?: string; processedDate?: string; note?: string },
) {
  updateWhere("dailyCheckIssues", (i: any) => i.id === id, fields)
  revalidatePath("/checksheets/daily")
  revalidatePath("/checksheets/daily/[equipmentId]", "layout")
}

export async function deleteDailyCheckIssue(id: number) {
  removeWhere("dailyCheckIssues", (i: any) => i.id === id)
  revalidatePath("/checksheets/daily")
  revalidatePath("/checksheets/daily/[equipmentId]", "layout")
}
