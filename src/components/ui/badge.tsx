import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.8)]",
    secondary: "border-transparent bg-[hsl(var(--secondary))] text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--secondary)/0.8)]",
    destructive: "border-transparent bg-[hsl(var(--danger))] text-white hover:bg-[hsl(var(--danger)/0.8)]",
    outline: "text-[hsl(var(--text))]",
  }
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", variants[variant as keyof typeof variants], className)} {...props} />
  )
}
export { Badge }
