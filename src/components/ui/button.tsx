import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 button-scale",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary-dark text-primary-foreground hover:from-primary/90 hover:to-primary-dark/90 shadow-md hover:shadow-lg",
        destructive:
          "bg-gradient-to-r from-destructive to-red-600 text-destructive-foreground hover:from-destructive/90 hover:to-red-600/90 shadow-md hover:shadow-lg",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent shadow-sm hover:shadow-md",
        secondary:
          "bg-gradient-to-r from-secondary to-muted text-secondary-foreground hover:from-secondary/80 hover:to-muted/80 shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-105",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-dark transition-colors",
        success: "bg-gradient-to-r from-success to-emerald-600 text-success-foreground hover:from-success/90 hover:to-emerald-600/90 shadow-md hover:shadow-lg",
        warning: "bg-gradient-to-r from-warning to-amber-600 text-warning-foreground hover:from-warning/90 hover:to-amber-600/90 shadow-md hover:shadow-lg",
        info: "bg-gradient-to-r from-info to-sky-600 text-info-foreground hover:from-info/90 hover:to-sky-600/90 shadow-md hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
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