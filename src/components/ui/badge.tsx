import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80 shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border bg-background hover:bg-accent hover:text-accent-foreground",
        success:
          "border-transparent bg-gradient-to-r from-success to-emerald-600 text-success-foreground hover:from-success/80 hover:to-emerald-600/80 shadow-sm",
        warning:
          "border-transparent bg-gradient-to-r from-warning to-amber-600 text-warning-foreground hover:from-warning/80 hover:to-amber-600/80 shadow-sm",
        info:
          "border-transparent bg-gradient-to-r from-info to-sky-600 text-info-foreground hover:from-info/80 hover:to-sky-600/80 shadow-sm",
        // Badge specifici per stati dipendenti
        "attivo":
          "border-transparent bg-gradient-to-r from-success to-emerald-600 text-white hover:from-success/90 hover:to-emerald-600/90 shadow-sm",
        "ferie":
          "border-transparent bg-gradient-to-r from-info to-sky-600 text-white hover:from-info/90 hover:to-sky-600/90 shadow-sm",
        "part-time":
          "border-transparent bg-gradient-to-r from-warning to-amber-600 text-white hover:from-warning/90 hover:to-amber-600/90 shadow-sm",
        "scaduto":
          "border-transparent bg-gradient-to-r from-destructive to-red-600 text-white hover:from-destructive/90 hover:to-red-600/90 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }