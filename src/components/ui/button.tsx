import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap font-medium ring-offset-background transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft",
        supportive: "bg-supportive text-supportive-foreground hover:bg-supportive/90 shadow-soft",
        encouraging: "bg-encouraging text-encouraging-foreground hover:bg-encouraging/90 shadow-soft",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft",
        outline: "bg-card text-card-foreground hover:bg-card-soft shadow-soft",
        plan: "bg-card text-progress hover:bg-progress hover:text-progress-foreground shadow-soft",
        checkin: "bg-checkin text-checkin-foreground hover:bg-checkin/90 shadow-soft",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-secondary-soft text-foreground-soft hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        large: "bg-gradient-primary text-primary-foreground hover:shadow-elevated transform hover:scale-[1.02] transition-bounce",
        soft: "bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground shadow-soft",
      },
      size: {
        default: "h-12 px-6 py-3 text-base rounded-full",
        sm: "h-10 px-4 py-2 text-sm rounded-full",
        lg: "h-16 px-8 py-4 text-lg rounded-full",
        xl: "h-20 px-12 py-6 text-xl rounded-full",
        icon: "h-12 w-12 rounded-full",
        "icon-sm": "h-10 w-10 rounded-full",
        "icon-lg": "h-16 w-16 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
