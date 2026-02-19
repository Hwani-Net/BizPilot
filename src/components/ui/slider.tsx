import * as React from "react"
import { cn } from "@/lib/utils"

const Slider = React.forwardRef<HTMLInputElement, any>(({ className, value, onValueChange, min, max, step, ...props }, ref) => (
  <input
    type="range"
    className={cn("w-full h-2 bg-[hsl(var(--bg-elevated))] rounded-lg appearance-none cursor-pointer accent-[hsl(var(--primary))]", className)}
    value={Array.isArray(value) ? value[0] : value}
    onChange={(e) => onValueChange([Number(e.target.value)])}
    min={min}
    max={max}
    step={step}
    ref={ref}
    {...props}
  />
))
Slider.displayName = "Slider"
export { Slider }
