import * as React from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const handleButtonClick = () => {
    inputRef.current?.showPicker()
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return "Pick a time"
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className={className}>
      {label && <Label className="text-sm font-medium mb-2 block">{label}</Label>}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start",
            !time && "text-muted-foreground"
          )}
          onClick={handleButtonClick}
        >
          <Clock className="h-4 w-4 mr-2" />
          {formatTime(time)}
        </Button>
        <input
          ref={inputRef}
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}