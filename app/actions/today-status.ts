"use server"

import { selectAll } from "@/lib/local-store"
import { FIVE_S_CATALOG } from "@/lib/constants/five-s-catalog"
import { isDayOffDate, isWeekend } from "@/lib/date-utils"
import { filledValue, isDueOnDay, statusFromSlots, type TodayStatus } from "@/lib/today-check"

function dayOffChecker(year: number, month: number, holidays: number[] | undefined, workdays: number[] | undefined) {
  return (day: number) => isDayOffDate(year, month, day, holidays ?? [], workdays ?? [])
}

export async function getTodayCheckStatuses() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  const equipment = selectAll<any>("equipment")
  const dailyItems = selectAll<any>("dailyCheckItems")
  const dailySheets = selectAll<any>("dailyCheckSheets")
  const dailyEntries = selectAll<any>("dailyCheckEntries")
  const fiveSTargets = selectAll<any>("fiveSTargets")
  const fiveSItems = selectAll<any>("fiveSCheckItems")
  const fiveSSheets = selectAll<any>("fiveSSheets")
  const fiveSEntries = selectAll<any>("fiveSEntries")
  const tempTargets = selectAll<any>("tempHumidityTargets")
  const tempSheets = selectAll<any>("tempHumiditySheets")
  const tempEntries = selectAll<any>("tempHumidityEntries")

  const daily: Record<number, TodayStatus> = {}
  for (const equip of equipment) {
    const sheet = dailySheets.find((row) => row.equipmentId === equip.id && row.year === year && row.month === month)
    const isDayOff = dayOffChecker(year, month, sheet?.holidays, sheet?.workdays)
    const filledItems = new Set(
      dailyEntries
        .filter((row) => row.sheetId === sheet?.id && row.day === day && filledValue(row.value))
        .map((row) => row.itemId),
    )
    const slots = dailyItems
      .filter((item) => item.equipmentId === equip.id)
      .map((item) => ({
        due: isDueOnDay(year, month, day, item.cycle || "일", isDayOff),
        filled: filledItems.has(item.id),
      }))
    const marks = {
      inspector: new Set<number>(sheet?.inspectorMarks ?? []),
      manager: new Set<number>(sheet?.managerMarks ?? []),
    }
    slots.push(
      {
        due: isDueOnDay(year, month, day, equip.inspectorCycle || "1회/일", isDayOff),
        filled: marks.inspector.has(day),
      },
      {
        due: isDueOnDay(year, month, day, equip.managerCycle || "1회/주", isDayOff),
        filled: marks.manager.has(day),
      },
    )
    daily[equip.id] = statusFromSlots(slots)
  }

  const fiveS: Record<number, TodayStatus> = {}
  for (const target of fiveSTargets) {
    const sheet = fiveSSheets.find((row) => row.targetId === target.id && row.year === year && row.month === month)
    const isDayOff = dayOffChecker(year, month, sheet?.holidays, sheet?.workdays)
    const ownItems = fiveSItems.filter((item) => item.targetId === target.id)
    const items = ownItems.length > 0 ? ownItems : FIVE_S_CATALOG.map((item) => ({ ...item, code: `t${target.id}-${item.code}` }))
    const filledCodes = new Set(
      fiveSEntries
        .filter((row) => row.sheetId === sheet?.id && row.day === day && filledValue(row.value))
        .map((row) => row.itemCode),
    )
    fiveS[target.id] = statusFromSlots(
      items.map((item) => ({
        due: isDueOnDay(year, month, day, item.cycle || "일", isDayOff),
        filled: filledCodes.has(item.code),
      })),
    )
  }

  const temp: Record<number, TodayStatus> = {}
  for (const target of tempTargets) {
    const sheet = tempSheets.find((row) => row.targetId === target.id && row.year === year && row.month === month)
    const isDayOff = dayOffChecker(year, month, sheet?.holidays, sheet?.workdays)
    const entry = tempEntries.find((row) => row.sheetId === sheet?.id && row.day === day)
    const due = !isDayOff(day)
    temp[target.id] = statusFromSlots([
      { due, filled: filledValue(entry?.temperature) },
      { due, filled: filledValue(entry?.humidity) },
      { due, filled: filledValue(entry?.checker) },
    ])
  }

  return { year, month, day, weekend: isWeekend(year, month, day), daily, fiveS, temp }
}
