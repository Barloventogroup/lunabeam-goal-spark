import * as React from "react"
import { BackButton } from "@/components/ui/back-button"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: React.ReactNode
  onBack?: () => void
  right?: React.ReactNode
  className?: string
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, onBack, right, className }, ref) => {
    return (
      <div 
        ref={ref}
        className={cn("fixed left-0 right-0 top-safe z-40 bg-card h-16 px-4", className)}
      >
        <div className="flex h-16 items-center gap-3">
          {onBack && <BackButton onClick={onBack} />}
          <h1 className="text-2xl font-bold flex-1">{title}</h1>
          {right && <div className="ml-auto">{right}</div>}
        </div>
      </div>
    )
  }
)

PageHeader.displayName = "PageHeader"
