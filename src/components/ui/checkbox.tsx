import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, ...props }, ref) => (
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        ref={ref}
        checked={checked}
        className={cn(
          "h-4 w-4 rounded border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked && "bg-primary text-primary-foreground",
          className
        )}
        {...props}
      />
      {checked && (
        <Check className="h-3 w-3 text-primary-foreground" />
      )}
    </div>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }