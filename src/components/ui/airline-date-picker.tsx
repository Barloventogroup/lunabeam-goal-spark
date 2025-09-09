import * as React from "react"
import { format, addDays, startOfDay, isSameDay } from "date-fns"
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface AirlineDatePickerProps {
  dateRange?: DateRange
  onDateRangeChange: (dateRange: DateRange | undefined) => void
  placeholder?: {
    start: string
    end: string
  }
  className?: string
  disabled?: boolean
}

export function AirlineDatePicker({
  dateRange,
  onDateRangeChange,
  placeholder = {
    start: "Start date",
    end: "End date"
  },
  className,
  disabled = false
}: AirlineDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [focusedInput, setFocusedInput] = React.useState<'start' | 'end'>('start')

  const handleDateSelect = (newDateRange: DateRange | undefined) => {
    if (!newDateRange) {
      onDateRangeChange(undefined)
      return
    }

    // If we have a start date but no end date, and user clicks same date, set it as end date
    if (newDateRange.from && !newDateRange.to && dateRange?.from && isSameDay(newDateRange.from, dateRange.from)) {
      onDateRangeChange({
        from: dateRange.from,
        to: dateRange.from
      })
      setIsOpen(false)
      return
    }

    // If we're focusing on start and have both dates, clear and start over
    if (focusedInput === 'start' && dateRange?.from && dateRange?.to) {
      onDateRangeChange({
        from: newDateRange.from,
        to: undefined
      })
      setFocusedInput('end')
      return
    }

    // If we have start date and user selects end date
    if (newDateRange.from && newDateRange.to) {
      onDateRangeChange(newDateRange)
      setIsOpen(false)
      return
    }

    // If we only have start date, wait for end date
    if (newDateRange.from && !newDateRange.to) {
      onDateRangeChange(newDateRange)
      setFocusedInput('end')
      return
    }

    onDateRangeChange(newDateRange)
  }

  const formatDateDisplay = (date: Date | undefined) => {
    if (!date) return null
    return format(date, "MMM dd, yyyy")
  }


  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="grid grid-cols-2 gap-2">
            {/* Start Date */}
            <Button
              variant="outline"
              className={cn(
                "h-14 justify-start text-left font-normal relative overflow-hidden",
                !dateRange?.from && "text-muted-foreground",
                focusedInput === 'start' && isOpen && "ring-2 ring-primary"
              )}
              disabled={disabled}
              onClick={() => {
                setFocusedInput('start')
                setIsOpen(true)
              }}
            >
              <div className="flex flex-col items-start w-full">
                <span className="text-xs text-muted-foreground font-medium mb-1">
                  {placeholder.start}
                </span>
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {formatDateDisplay(dateRange?.from) || "Select date"}
                  </span>
                </div>
              </div>
            </Button>

            {/* End Date */}
            <Button
              variant="outline"
              className={cn(
                "h-14 justify-start text-left font-normal relative overflow-hidden",
                !dateRange?.to && "text-muted-foreground",
                focusedInput === 'end' && isOpen && "ring-2 ring-primary"
              )}
              disabled={disabled}
              onClick={() => {
                setFocusedInput('end')
                setIsOpen(true)
              }}
            >
              <div className="flex flex-col items-start w-full">
                <span className="text-xs text-muted-foreground font-medium mb-1">
                  {placeholder.end}
                </span>
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="text-sm">
                    {formatDateDisplay(dateRange?.to) || "Select date"}
                  </span>
                </div>
              </div>
            </Button>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0 bg-background border border-border" align="start">
          <div className="flex">
            {/* Calendar */}
            <div className="p-4">
              <div className="mb-4 flex items-center justify-center gap-2 text-sm">
                <span className={cn(
                  "px-3 py-1 rounded-full transition-colors",
                  focusedInput === 'start' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {formatDateDisplay(dateRange?.from) || "Start"}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className={cn(
                  "px-3 py-1 rounded-full transition-colors",
                  focusedInput === 'end' 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {formatDateDisplay(dateRange?.to) || "End"}
                </span>
              </div>
              
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateSelect}
                numberOfMonths={2}
                className="pointer-events-auto"
              />

              {dateRange?.from && dateRange?.to && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    onClick={() => setIsOpen(false)}
                    className="w-full"
                  >
                    Apply dates
                  </Button>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}