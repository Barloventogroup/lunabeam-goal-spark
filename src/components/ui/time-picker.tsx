import * as React from "react"
import { Label } from "@/components/ui/label"

interface TimePickerProps {
  time?: string
  onTimeChange: (time: string) => void
  label?: string
  className?: string
}

export function TimePicker({
  time = "",
  onTimeChange,
  label,
  className
}: TimePickerProps) {
  return (
    <div className={className}>
      {label && <Label className="text-sm font-medium mb-2 block">{label}</Label>}
      <input
        type="time"
        value={time}
        onChange={(e) => onTimeChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}