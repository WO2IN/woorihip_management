"use server"

import { revalidatePath } from "next/cache"
import { findOne, insertRow, removeWhere, selectWhere, updateById, selectAll } from "@/lib/local-store"
import { FIVE_S_CATALOG } from "@/lib/constants/five-s-catalog"
import { canonicalFloor } from "@/lib/floor"
import { isDayOffDate, isWeekend, scheduledDaysForCycle } from "@/lib/date-utils"

export async function getFiveSTargets() {
  return selectAll("fiveSTargets")
}

export async function getFiveSTargetById(id: number) {
  return findOne("fiveSTargets", (t: any) => t.id === id)
}

export async function createFiveSTarget(data: { name: string; floor?: string; department?: string; manager?: string; standard?: string }) {
  const result = insertRow("fiveSTargets", {
    ...data,
    floor: canonicalFloor(data.floor, data.name),
    createdAt: new Date().toISOString(),
  })
  revalidatePath("/checksheets/5s")
  return result
}

export async function deleteFiveSTarget(id: number) {
  const items = selectWhere("fiveSCheckItems", (i: any) => i.targetId === id)
  const sheets = selectWhere("fiveSSheets", (s: any) => s.targetId === id)
  const itemCodes = new Set(items.map((i: any) => i.code))
  const sheetIds = new Set(sheets.map((s: any) => s.id))
  removeWhere("fiveSEntries", (e: any) => itemCodes.has(e.itemCode) || sheetIds.has(e.sheetId))
  removeWhere("fiveSCheckItems", (i: any) => i.targetId === id)
  removeWhere("fiveSSheets", (s: any) => s.targetId === id)
  removeWhere("fiveSTargets", (t: any) => t.id === id)
  revalidatePath("/checksheets/5s")
}

export async function updateFiveSTarget(id: number, data: { name?: string; floor?: string; department?: string; manager?: string; standard?: string }) {
  const result = updateById("fiveSTargets", id, {
    ...data,
    ...(data.floor !== undefined || data.name !== undefined
      ? { floor: canonicalFloor(data.floor, data.name) }
      : {}),
  })
  revalidatePath("/checksheets/5s")
  revalidatePath(`/checksheets/5s/${id}`)
  return result
}

export async function getFiveSCheckItems(targetId: number) {
  const existing = selectWhere("fiveSCheckItems", (i: any) => i.targetId === targetId)
  if (existing.length > 0) {
    return existing.sort((a: any, b: any) => a.category.localeCompare(b.category) || a.no - b.no)
  }
  // Seed with the default catalog on first access so existing behavior is preserved.
  const seeded = FIVE_S_CATALOG.map((item) =>
    insertRow("fiveSCheckItems", {
      targetId,
      category: item.category,
      no: item.no,
      content: item.content,
      cycle: item.cycle,
      code: `t${targetId}-${item.code}`,
    }),
  )
  return seeded
}

export async function createFiveSCheckItem(
  targetId: number,
  data: { category: string; content: string; cycle: string },
) {
  const siblings = selectWhere("fiveSCheckItems", (i: any) => i.targetId === targetId && i.category === data.category)
  const nextNo = siblings.length > 0 ? Math.max(...siblings.map((i: any) => i.no)) + 1 : 1
  const created = insertRow("fiveSCheckItems", {
    targetId,
    category: data.category,
    no: nextNo,
    content: data.content,
    cycle: data.cycle || "일",
    code: `t${targetId}-c${Date.now()}`,
  })
  revalidatePath("/checksheets/5s")
  revalidatePath(`/checksheets/5s/${targetId}`)
  return created
}

export async function updateFiveSCheckItem(
  id: number,
  targetId: number,
  data: { content?: string; cycle?: string },
) {
  const result = updateById("fiveSCheckItems", id, data)
  revalidatePath("/checksheets/5s")
  revalidatePath(`/checksheets/5s/${targetId}`)
  return result
}

export async function deleteFiveSCheckItem(id: number, targetId: number) {
  const item = findOne<any>("fiveSCheckItems", (i: any) => i.id === id)
  removeWhere("fiveSCheckItems", (i: any) => i.id === id)
  if (item) {
    removeWhere("fiveSEntries", (e: any) => e.itemCode === item.code)
  }
  revalidatePath("/checksheets/5s")
  revalidatePath(`/checksheets/5s/${targetId}`)
}

export async function getOrCreateFiveSSheet(targetId: number, year: number, month: number) {
  const existing = findOne("fiveSSheets", (s: any) => s.targetId === targetId && s.year === year && s.month === month)
  if (existing) return existing

  return insertRow("fiveSSheets", {
    targetId,
    year,
    month,
    remarks: null,
    writer: null,
    reviewer: null,
    approver: null,
    createdAt: new Date().toISOString(),
  })
}

export async function getFiveSEntries(sheetId: number) {
  return selectWhere("fiveSEntries", (e: any) => e.sheetId === sheetId)
}

export async function upsertFiveSEntry(sheetId: number, itemCode: string, day: number, value: string) {
  const existing = findOne(
    "fiveSEntries",
    (e: any) => e.sheetId === sheetId && e.itemCode === itemCode && e.day === day,
  )

  if (existing) {
    updateById("fiveSEntries", (existing as any).id, { value })
  } else {
    insertRow("fiveSEntries", { sheetId, itemCode, day, value })
  }
  revalidatePath("/checksheets/5s")
  revalidatePath("/checksheets/5s/[targetId]", "layout")
}

export async function bulkFillFiveSEntries(
  sheetId: number,
  year: number,
  month: number,
  uptoDay: number,
  symbol: string,
  items: { code: string; cycle: string }[],
  fromDay = 1,
) {
  const sheet = findOne<any>("fiveSSheets", (s: any) => s.id === sheetId)
  const holidays: number[] = sheet?.holidays ?? []
  const workdays: number[] = sheet?.workdays ?? []
  const isDayOff = (day: number) => isDayOffDate(year, month, day, holidays, workdays)
  const startDay = Math.max(1, fromDay)

  for (const item of items) {
    const hasNA = selectWhere(
      "fiveSEntries",
      (e: any) => e.sheetId === sheetId && e.itemCode === item.code && e.value === "N/A",
    ).length > 0
    if (hasNA) continue

    const scheduledDays = scheduledDaysForCycle(
      year,
      month,
      startDay,
      uptoDay,
      item.cycle,
      isDayOff,
    )
  
    for (const day of scheduledDays) {
      const existing = findOne(
        "fiveSEntries",
        (e: any) => e.sheetId === sheetId && e.itemCode === item.code && e.day === day,
      )
  
      if (!existing || !(existing as any).value) {
        if (existing) {
          updateById("fiveSEntries", (existing as any).id, { value: symbol })
        } else {
          insertRow("fiveSEntries", {
            sheetId,
            itemCode: item.code,
            day,
            value: symbol,
          })
        }
      }
    }
  }
  revalidatePath("/checksheets/5s")
  revalidatePath("/checksheets/5s/[targetId]", "layout")
}

export async function clearFiveSSheetEntries(sheetId: number) {
  removeWhere("fiveSEntries", (e: any) => e.sheetId === sheetId)
  revalidatePath("/checksheets/5s")
  revalidatePath("/checksheets/5s/[targetId]", "layout")
}

export async function updateFiveSSheetFields(
  sheetId: number,
  fields: { remarks?: string; writer?: string; reviewer?: string; approver?: string },
) {
  updateById("fiveSSheets", sheetId, fields)
  revalidatePath("/checksheets/5s")
  revalidatePath("/checksheets/5s/[targetId]", "layout")
}

export async function toggleFiveSHoliday(sheetId: number, day: number) {
  const sheet = findOne<any>("fiveSSheets", (s: any) => s.id === sheetId)
  if (!sheet) return []
  if (isWeekend(sheet.year, sheet.month, day)) {
    const current: number[] = sheet.workdays ?? []
    const opening = !current.includes(day)
    const next = opening ? [...current, day].sort((a, b) => a - b) : current.filter((d) => d !== day)
    updateById("fiveSSheets", sheetId, { workdays: next })
    if (!opening) {
      removeWhere("fiveSEntries", (e: any) => e.sheetId === sheetId && e.day === day)
    }
    revalidatePath("/checksheets/5s")
    revalidatePath("/checksheets/5s/[targetId]", "layout")
    return next
  }
  const current: number[] = sheet.holidays ?? []
  const adding = !current.includes(day)
  const next = adding ? [...current, day].sort((a, b) => a - b) : current.filter((d) => d !== day)
  updateById("fiveSSheets", sheetId, { holidays: next })
  if (adding) {
    removeWhere("fiveSEntries", (e: any) => e.sheetId === sheetId && e.day === day)
  }
  revalidatePath("/checksheets/5s")
  revalidatePath("/checksheets/5s/[targetId]", "layout")
  return next
}
