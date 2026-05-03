'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export type HeatmapDay = { date: string; count: number }

interface Props {
  days: HeatmapDay[]
  total: number
}

function cellBg(count: number, isFuture: boolean) {
  if (isFuture) return 'bg-transparent'
  if (count === 0) return 'bg-slate-100'
  if (count === 1) return 'bg-emerald-200'
  if (count <= 3) return 'bg-emerald-400'
  if (count <= 6) return 'bg-emerald-600'
  return 'bg-[#0A6A47]'
}

export function ActivityHeatmap({ days, total }: Props) {
  const { weeks, monthLabels } = useMemo(() => {
    const countMap = new Map(days.map(d => [d.date, d.count]))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().slice(0, 10)

    // End on the coming Saturday so every column is a full Sun–Sat week
    const daysToSat = (6 - today.getDay() + 7) % 7
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + daysToSat)

    const NUM_WEEKS = 20
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - NUM_WEEKS * 7 + 1) // always a Sunday

    type DayCell = {
      date: string; count: number; dow: number
      isFuture: boolean; isToday: boolean; monthDay: number; jsDate: Date
    }

    const allDays: DayCell[] = []
    const cur = new Date(startDate)
    for (let i = 0; i < NUM_WEEKS * 7; i++) {
      const ds = cur.toISOString().slice(0, 10)
      allDays.push({
        date: ds,
        count: countMap.get(ds) ?? 0,
        dow: cur.getDay(),
        isFuture: cur > today,
        isToday: ds === todayStr,
        monthDay: cur.getDate(),
        jsDate: new Date(cur),
      })
      cur.setDate(cur.getDate() + 1)
    }

    // Chunk into weeks (allDays[0] is always Sunday, so week[dow] === day with that dow)
    const weeks: DayCell[][] = []
    for (let i = 0; i < allDays.length; i += 7) weeks.push(allDays.slice(i, i + 7))

    // One label per month at its first column appearance
    const seen = new Set<string>()
    const monthLabels: Array<{ label: string; wi: number }> = []
    weeks.forEach((week, wi) => {
      for (const d of week) {
        if (d.monthDay === 1) {
          const label = d.jsDate.toLocaleDateString('en-US', { month: 'short' })
          if (!seen.has(label)) { seen.add(label); monthLabels.push({ label, wi }) }
          break
        }
      }
    })

    return { weeks, monthLabels }
  }, [days])

  return (
    <div className="select-none">
      {/* Month labels row */}
      <div className="flex gap-[3px] mb-1" style={{ paddingLeft: 28 }}>
        {weeks.map((_, wi) => (
          <div
            key={wi}
            className="text-[9px] font-semibold text-slate-400 overflow-visible"
            style={{ width: 11, flexShrink: 0 }}
          >
            {monthLabels.find(m => m.wi === wi)?.label ?? ''}
          </div>
        ))}
      </div>

      {/* Grid: Mon → Sun rows */}
      <div className="flex flex-col gap-[3px]">
        {([1, 2, 3, 4, 5, 6, 0] as const).map(dow => (
          <div key={dow} className="flex items-center gap-[3px]">
            {/* Day-of-week label */}
            <div
              className="text-[9px] text-slate-300 font-medium text-right pr-1 flex-shrink-0"
              style={{ width: 24 }}
            >
              {dow === 1 ? 'Mon' : dow === 3 ? 'Wed' : dow === 5 ? 'Fri' : ''}
            </div>

            {/* Cells */}
            {weeks.map((week, wi) => {
              const day = week[dow]
              const bg = cellBg(day.count, day.isFuture)
              const fmtDate = day.jsDate.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              })
              const tipText = day.isFuture
                ? ''
                : `${day.count} application${day.count !== 1 ? 's' : ''} · ${fmtDate}`

              return (
                <div
                  key={wi}
                  className="relative group/cell flex-shrink-0"
                  style={{ width: 11, height: 11 }}
                >
                  <div
                    className={cn(
                      'w-full h-full rounded-[2px] transition-transform duration-100',
                      bg,
                      day.isToday && !day.isFuture && 'outline outline-[1.5px] outline-offset-[1.5px] outline-[#0A6A47]',
                      !day.isFuture && 'group-hover/cell:scale-125 cursor-default',
                    )}
                  />
                  {tipText && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 hidden group-hover/cell:block">
                      <div className="bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
                        {tipText}
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[4px] border-x-transparent border-t-[4px] border-t-slate-900" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-[11px] text-slate-400">
          <span className="font-semibold text-slate-600">{total}</span> applications in the last 20 weeks
        </p>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-400 mr-0.5">Less</span>
          {(['bg-slate-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-600', 'bg-[#0A6A47]'] as const).map(
            (c, i) => (
              <div key={i} className={cn('rounded-[2px] flex-shrink-0', c)} style={{ width: 11, height: 11 }} />
            ),
          )}
          <span className="text-[9px] text-slate-400 ml-0.5">More</span>
        </div>
      </div>
    </div>
  )
}
