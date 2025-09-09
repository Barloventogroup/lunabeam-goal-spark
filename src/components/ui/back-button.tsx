import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  onClick: () => void
  className?: string
  variant?: "icon" | "text" | "minimal"
  size?: "sm" | "default" | "lg"
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
          </Button>
        )
      
      case "minimal":
        return (
          <Button
            ref={ref}
            variant="ghost"
            size={size}
            onClick={onClick}
            disabled={disabled}
            className={cn(baseClasses, "px-2 hover:bg-muted", className)}
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
            size={size}
            onClick={onClick}
            disabled={disabled}
            className={cn(baseClasses, "p-2", className)}
            {...props}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )
    }
  }
)

BackButton.displayName = "BackButton"