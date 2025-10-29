import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  onClick: () => void
  className?: string
  variant?: "icon" | "text" | "minimal"
  size?: "sm" | "default" | "lg" | "icon"
  disabled?: boolean
}

export const BackButton = React.forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ onClick, className, variant = "icon", size = "sm", disabled = false, ...props }, ref) => {
    const baseClasses = "flex items-center gap-2 text-foreground-soft hover:text-foreground transition-smooth"
    
    switch (variant) {
      case "text":
        return (
          <Button
            ref={ref}
            variant="ghost"
            size={size}
            onClick={onClick}
            disabled={disabled}
            className={cn(baseClasses, "px-2", className)}
            {...props}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )
      
      case "minimal":
        return (
          <Button
            ref={ref}
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(baseClasses, "h-8 w-8 p-1 hover:bg-muted", className)}
            aria-label="Back"
            {...props}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )
      
      case "icon":
      default:
        return (
          <Button
            ref={ref}
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(baseClasses, "h-8 w-8 p-1", className)}
            aria-label="Back"
            {...props}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )
    }
  }
)

BackButton.displayName = "BackButton"