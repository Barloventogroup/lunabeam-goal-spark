import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
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
  const [startInputValue, setStartInputValue] = React.useState("")
  const [endInputValue, setEndInputValue] = React.useState("")
  const [isStartOpen, setIsStartOpen] = React.useState(false)
  const [isEndOpen, setIsEndOpen] = React.useState(false)

  // Get today's date for comparison
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Update input values when dateRange changes
  React.useEffect(() => {
    setStartInputValue(dateRange?.from ? format(dateRange.from, "MMM dd, yyyy") : "")
    setEndInputValue(dateRange?.to ? format(dateRange.to, "MMM dd, yyyy") : "")
  }, [dateRange])

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

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateRangeChange({
        from: date,
        to: dateRange?.to
      })
      setIsStartOpen(false)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateRangeChange({
        from: dateRange?.from,
        to: date
      })
      setIsEndOpen(false)
    }
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2", className)}>
      {/* Start Date */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">
          {placeholder.start}
        </label>
        <div className="relative">
          <Input
            value={startInputValue}
            onChange={handleStartInputChange}
            placeholder="Select date"
            className="h-12 pr-10"
            disabled={disabled}
          />
          <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-10 w-8 p-0"
                disabled={disabled}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border border-border" align="start">
              <Calendar
                mode="single"
                selected={dateRange?.from}
                onSelect={handleStartDateSelect}
                initialFocus
                className="pointer-events-auto"
                disabled={(date) => date < today}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* End Date */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">
          {placeholder.end}
        </label>
        <div className="relative">
          <Input
            value={endInputValue}
            onChange={handleEndInputChange}
            placeholder="Select date"
            className="h-12 pr-10"
            disabled={disabled}
          />
          <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-10 w-8 p-0"
                disabled={disabled}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background border border-border" align="start">
              <Calendar
                mode="single"
                selected={dateRange?.to}
                onSelect={handleEndDateSelect}
                initialFocus
                className="pointer-events-auto"
                disabled={(date) => date < today}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}