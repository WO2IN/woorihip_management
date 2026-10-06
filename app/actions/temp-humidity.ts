"use server"

import { revalidatePath } from "next/cache"
import { findOne, insertRow, removeWhere, selectWhere, updateById, selectAll } from "@/lib/local-store"
import { canonicalFloor } from "@/lib/floor"
import { isWeekend } from "@/lib/date-utils"

export async function getTempHumidityTargets() {
  return selectAll("tempHumidityTargets")
}

export async function getTempHumidityTargetById(id: number) {
  return findOne("tempHumidityTargets", (t: any) => t.id === id)
}

export async function createTempHumidityTarget(data: {
  name: string
  floor?: string
  department?: string
  manager?: string
  standard?: string
  tempLower?: number | null
  tempUpper?: number | null
  humidityLower?: number | null
  humidityUpper?: number | null
}) {
  const result = insertRow("tempHumidityTargets", {
    tempLower: 10,
    tempUpper: 30,
    humidityLower: 0,
    humidityUpper: 60,
    ...data,
    floor: canonicalFloor(data.floor, data.name),
    createdAt: new Date().toISOString(),
  })
  revalidatePath("/checksheets/temp-humidity")
  return result
}

export async function deleteTempHumidityTarget(id: number) {
  const sheets = selectWhere("tempHumiditySheets", (s: any) => s.targetId === id)
  const sheetIds = new Set(sheets.map((s: any) => s.id))
  removeWhere("tempHumidityEntries", (e: any) => sheetIds.has(e.sheetId))
  removeWhere("tempHumidityIssues", (i: any) => sheetIds.has(i.sheetId) || i.targetId === id)
  removeWhere("tempHumiditySheets", (s: any) => s.targetId === id)
  removeWhere("tempHumidityTargets", (t: any) => t.id === id)
  revalidatePath("/checksheets/temp-humidity")
}

export async function updateTempHumidityTarget(
  id: number,
  data: {
    name?: string
    floor?: string
    department?: string
    manager?: string
    standard?: string
    tempLower?: number | null
    tempUpper?: number | null
    humidityLower?: number | null
    humidityUpper?: number | null
  },
) {
  const result = updateById("tempHumidityTargets", id, {
    ...data,
    ...(data.floor !== undefined || data.name !== undefined
      ? { floor: canonicalFloor(data.floor, data.name) }
      : {}),
  })
  revalidatePath("/checksheets/temp-humidity")
  revalidatePath(`/checksheets/temp-humidity/${id}`)
  return result
}

export async function getOrCreateTempHumiditySheet(targetId: number, year: number, month: number) {
  const existing = findOne("tempHumiditySheets", (s: any) => s.targetId === targetId && s.year === year && s.month === month)
  if (existing) return existing

  return insertRow("tempHumiditySheets", {
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

export async function getTempHumidityEntries(sheetId: number) {
  return selectWhere("tempHumidityEntries", (e: any) => e.sheetId === sheetId).sort(
    (a: any, b: any) => a.day - b.day,
  )
}

export async function upsertTempHumidityEntry(
  sheetId: number,
  day: number,
  fields: { temperature?: string | null; humidity?: string | null; checker?: string | null },
) {
  const existing = findOne("tempHumidityEntries", (e: any) => e.sheetId === sheetId && e.day === day)

  if (existing) {
    updateById("tempHumidityEntries", (existing as any).id, fields)
  } else {
    insertRow("tempHumidityEntries", { sheetId, day, ...fields })
  }
  revalidatePath("/checksheets/temp-humidity")
  revalidatePath("/checksheets/temp-humidity/[targetId]", "layout")
}

export async function bulkUpsertTempHumidityEntries(
  sheetId: number,
  entries: { day: number; temperature: string; humidity: string; checker?: string | null }[],
) {
  for (const { day, temperature, humidity, checker } of entries) {
    const existing = findOne("tempHumidityEntries", (e: any) => e.sheetId === sheetId && e.day === day)
    if (existing) {
      const patch: Record<string, string> = {}
      if (!(existing as any).temperature) patch.temperature = temperature
      if (!(existing as any).humidity) patch.humidity = humidity
      if (checker && !(existing as any).checker) patch.checker = checker
      if (Object.keys(patch).length > 0) {
        updateById("tempHumidityEntries", (existing as any).id, patch)
      }
    } else {
      insertRow("tempHumidityEntries", { sheetId, day, temperature, humidity, checker: checker ?? null })
    }
  }
  revalidatePath("/checksheets/temp-humidity")
  revalidatePath("/checksheets/temp-humidity/[targetId]", "layout")
}

export async function clearTempHumidityEntries(sheetId: number) {
  removeWhere("tempHumidityEntries", (e: any) => e.sheetId === sheetId)
  revalidatePath("/checksheets/temp-humidity")
  revalidatePath("/checksheets/temp-humidity/[targetId]", "layout")
}

export async function updateTempHumiditySheetFields(
  sheetId: number,
  fields: { remarks?: string; writer?: string; reviewer?: string; approver?: string },
) {
  updateById("tempHumiditySheets", sheetId, fields)
  revalidatePath("/checksheets/temp-humidity")
  revalidatePath("/checksheets/temp-humidity/[targetId]", "layout")
}

export async function toggleTempHumidityHoliday(sheetId: number, day: number) {
  const sheet = findOne<any>("tempHumiditySheets", (s: any) => s.id === sheetId)
  if (!sheet) return []
  if (isWeekend(sheet.year, sheet.month, day)) {
    const current: number[] = sheet.workdays ?? []
    const opening = !current.includes(day)
    const next = opening ? [...current, day].sort((a, b) => a - b) : current.filter((d: number) => d !== day)
    updateById("tempHumiditySheets", sheetId, { workdays: next })
    if (!opening) {
      removeWhere("tempHumidityEntries", (e: any) => e.sheetId === sheetId && e.day === day)
    }
    revalidatePath("/checksheets/temp-humidity")
    revalidatePath("/checksheets/temp-humidity/[targetId]", "layout")
    return next
  }
  const current: number[] = sheet.holidays ?? []
  const next = current.includes(day) ? current.filter((d: number) => d !== day) : [...current, day].sort((a, b) => a - b)
  updateById("tempHumiditySheets", sheetId, { holidays: next })
  if (!current.includes(day)) {
    removeWhere("tempHumidityEntries", (e: any) => e.sheetId === sheetId && e.day === day)
  }
  revalidatePath("/checksheets/temp-humidity")
  revalidatePath("/checksheets/temp-humidity/[targetId]", "layout")
  return next
}
