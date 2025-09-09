import * as React from "react"
import { format, addDays, startOfDay, isSameDay, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon, ArrowRight } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [startInputValue, setStartInputValue] = React.useState("")
  const [endInputValue, setEndInputValue] = React.useState("")

  // Update input values when dateRange changes
  React.useEffect(() => {
    setStartInputValue(dateRange?.from ? format(dateRange.from, "MMM dd, yyyy") : "")
    setEndInputValue(dateRange?.to ? format(dateRange.to, "MMM dd, yyyy") : "")
  }, [dateRange])

  const handleDateSelect = (newDateRange: DateRange | undefined) => {
    if (!newDateRange) {
      onDateRangeChange(undefined)
      return
    }

    // If focusing on start and user clicks the same start date that's already selected, deselect it
    if (focusedInput === 'start' && newDateRange.from && dateRange?.from && isSameDay(newDateRange.from, dateRange.from) && !newDateRange.to && !dateRange?.to) {
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

  const parseDate = (value: string): Date | null => {
    if (!value.trim()) return null
    
    // Try multiple date formats
    const formats = [
      "MMM dd, yyyy",
      "MM/dd/yyyy", 
      "MM-dd-yyyy",
      "yyyy-MM-dd",
      "dd/MM/yyyy",
      "dd-MM-yyyy"
    ]
    
    for (const formatStr of formats) {
      try {
        const parsed = parse(value, formatStr, new Date())
        if (isValid(parsed)) return parsed
      } catch (e) {
        continue
      }
    }
    
    return null
  }

  const handleStartInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setStartInputValue(value)
    
    const parsedDate = parseDate(value)
    if (parsedDate) {
      onDateRangeChange({
        from: parsedDate,
        to: dateRange?.to
      })
    } else if (!value.trim()) {
      onDateRangeChange({
        from: undefined,
        to: dateRange?.to
      })
    }
  }

  const handleEndInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEndInputValue(value)
    
    const parsedDate = parseDate(value)
    if (parsedDate) {
      onDateRangeChange({
        from: dateRange?.from,
        to: parsedDate
      })
    } else if (!value.trim()) {
      onDateRangeChange({
        from: dateRange?.from,
        to: undefined
      })
    }
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
            <div className="relative">
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                {placeholder.start}
              </label>
              <div className="flex">
                <Input
                  value={startInputValue}
                  onChange={handleStartInputChange}
                  placeholder="Select date"
                  className={cn(
                    "h-12 pr-10",
                    focusedInput === 'start' && isOpen && "ring-2 ring-primary"
                  )}
                  disabled={disabled}
                  onFocus={() => setFocusedInput('start')}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-7 h-8 w-8 p-0"
                  onClick={() => {
                    setFocusedInput('start')
                    setIsOpen(true)
                  }}
                  disabled={disabled}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* End Date */}
            <div className="relative">
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                {placeholder.end}
              </label>
              <div className="flex">
                <Input
                  value={endInputValue}
                  onChange={handleEndInputChange}
                  placeholder="Select date"
                  className={cn(
                    "h-12 pr-10",
                    focusedInput === 'end' && isOpen && "ring-2 ring-primary"
                  )}
                  disabled={disabled}
                  onFocus={() => setFocusedInput('end')}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-7 h-8 w-8 p-0"
                  onClick={() => {
                    setFocusedInput('end')
                    setIsOpen(true)
                  }}
                  disabled={disabled}
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
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