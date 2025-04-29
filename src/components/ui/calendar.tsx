'use client'

import type { Locale } from 'date-fns'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CalendarProps {
  mode?: 'single' | 'range' | 'multiple'
  selected?: Date | Date[] | { from: Date; to: Date }
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  locale?: Locale
  className?: string
  classNames?: Record<string, string>
  showOutsideDays?: boolean
  month?: Date
  onMonthChange?: (date: Date) => void
}

function ModernCalendar({
  mode = 'single',
  selected,
  onSelect,
  disabled,
  locale = es,
  className,
  classNames,
  showOutsideDays = true,
  month: externalMonth,
  onMonthChange,
}: CalendarProps) {
  const [month, setMonth] = React.useState(() => externalMonth || new Date())

  React.useEffect(() => {
    if (externalMonth) {
      setMonth(externalMonth)
    }
  }, [externalMonth])

  const handleMonthChange = (newMonth: Date) => {
    setMonth(newMonth)
    onMonthChange?.(newMonth)
  }

  const daysInMonth = React.useMemo(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    return eachDayOfInterval({ start, end })
  }, [month])

  const weekDays = React.useMemo(() => {
    const weekDayNames = Array.from({ length: 7 }, (_, i) => {
      return format(new Date(2021, 0, i + 3), 'EEEEEE', { locale })
    })
    return weekDayNames
  }, [locale])

  const isDateSelected = (date: Date): boolean => {
    if (!selected) return false

    if (Array.isArray(selected)) {
      return selected.some((selectedDate) => isSameDay(selectedDate, date))
    }

    if (selected instanceof Date) {
      return isSameDay(selected, date)
    }

    if (typeof selected === 'object' && 'from' in selected && 'to' in selected) {
      const { from, to } = selected
      return date >= from && date <= to
    }

    return false
  }

  const handleDateClick = (date: Date) => {
    if (disabled?.(date)) return
    onSelect?.(date)
  }

  return (
    <div className={cn('p-3', className)}>
      <div className="relative flex items-center justify-center pt-1">
        <Button
          variant="outline"
          className={cn(
            'h-7 w-7 rounded-md bg-[#252530] p-0 text-gray-300 hover:bg-[#333340] hover:text-white',
            classNames?.nav_button_previous
          )}
          onClick={() => handleMonthChange(subMonths(month, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="mx-4 text-sm font-medium text-white">{format(month, 'MMMM yyyy', { locale })}</div>
        <Button
          variant="outline"
          className={cn(
            'h-7 w-7 rounded-md bg-[#252530] p-0 text-gray-300 hover:bg-[#333340] hover:text-white',
            classNames?.nav_button_next
          )}
          onClick={() => handleMonthChange(addMonths(month, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className={cn('mt-4 grid grid-cols-7 gap-1', classNames?.month)}>
        {weekDays.map((day) => (
          <div key={day} className={cn('text-center text-xs font-medium text-gray-400', classNames?.head_cell)}>
            {day}
          </div>
        ))}

        {daysInMonth.map((date) => {
          const isSelected = isDateSelected(date)
          const isDisabled = disabled?.(date) || false
          const isCurrentMonth = isSameMonth(date, month)
          const isCurrentDay = isToday(date)

          return (
            <Button
              key={date.toString()}
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9 rounded-md p-0 text-sm font-normal',
                isSelected
                  ? 'bg-primary hover:bg-primary text-white hover:text-white'
                  : 'text-gray-300 hover:bg-[#333340]',
                isCurrentDay && !isSelected && 'bg-[#333340] text-white',
                !isCurrentMonth && !showOutsideDays && 'invisible',
                !isCurrentMonth && showOutsideDays && 'text-gray-500 opacity-50',
                isDisabled && 'cursor-not-allowed text-gray-500 opacity-50',
                classNames?.day
              )}
              disabled={isDisabled}
              onClick={() => handleDateClick(date)}
            >
              {format(date, 'd')}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

ModernCalendar.displayName = 'ModernCalendar'

export { ModernCalendar }
