'use client'

import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { getDayRange } from '@/lib/date-utils'

interface TempHumidityChartProps {
  year: number
  month: number
  entries: { day: number; temperature: string | null; humidity: string | null }[]
  tempLower?: number
  tempUpper?: number
  humidityLower?: number
  humidityUpper?: number
}

const chartConfig = {
  temperature: { label: '온도(℃)', color: 'var(--chart-1)' },
  humidity: { label: '습도(%)', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function TempHumidityChart({
  year,
  month,
  entries,
  tempLower = 10,
  tempUpper = 30,
  humidityLower = 0,
  humidityUpper = 60,
}: TempHumidityChartProps) {
  const days = getDayRange(year, month)
  const entryMap = new Map(entries.map((e) => [e.day, e]))

  const data = days.map((day) => {
    const entry = entryMap.get(day)
    return {
      day: String(day),
      temperature: entry?.temperature != null ? Number(entry.temperature) : null,
      humidity: entry?.humidity != null ? Number(entry.humidity) : null,
    }
  })

  const yMax = Math.max(70, tempUpper + 10, humidityUpper + 10)
  const tickStep = 10
  const ticks = Array.from({ length: Math.ceil(yMax / tickStep) + 1 }, (_, i) => i * tickStep)

  return (
    <div className="temp-humidity-chart no-break flex flex-col gap-2 border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">온/습도 추이</h2>
        <p className="text-xs text-muted-foreground">
          관리기준: 온도 {tempLower}~{tempUpper}℃ (LCL {tempLower} / UCL {tempUpper}) · 습도 {humidityLower}~{humidityUpper}%
          (LCL {humidityLower} / UCL {humidityUpper})
        </p>
      </div>
      <ChartContainer config={chartConfig} className="aspect-auto h-[520px] min-h-0 w-full lg:h-[600px]">
        <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={32}
            domain={[0, yMax]}
            ticks={ticks}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ReferenceLine y={tempUpper} stroke="var(--chart-1)" strokeDasharray="4 4" label={{ value: `UCL ${tempUpper}`, position: 'insideTopRight', fontSize: 11, fill: 'var(--chart-1)' }} />
          <ReferenceLine y={tempLower} stroke="var(--chart-1)" strokeDasharray="4 4" label={{ value: `LCL ${tempLower}`, position: 'insideBottomRight', fontSize: 11, fill: 'var(--chart-1)' }} />
          <ReferenceLine y={humidityUpper} stroke="var(--chart-2)" strokeDasharray="4 4" label={{ value: `UCL ${humidityUpper}`, position: 'insideTopRight', fontSize: 11, fill: 'var(--chart-2)' }} />
          <ReferenceLine y={humidityLower} stroke="var(--chart-2)" strokeDasharray="4 4" label={{ value: `LCL ${humidityLower}`, position: 'insideBottomRight', fontSize: 11, fill: 'var(--chart-2)' }} />
          <Line
            dataKey="temperature"
            type="monotone"
            stroke="var(--color-temperature)"
            strokeWidth={2}
            dot={{ r: 2.5 }}
            connectNulls
          />
          <Line
            dataKey="humidity"
            type="monotone"
            stroke="var(--color-humidity)"
            strokeWidth={2}
            dot={{ r: 2.5 }}
            connectNulls
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
