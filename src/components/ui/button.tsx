import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default: "bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary)/0.9)]",
      destructive: "bg-red-500 text-white hover:bg-red-600",
      outline: "border border-[hsl(var(--border))] bg-transparent hover:bg-[hsl(var(--accent)/0.1)] hover:text-[hsl(var(--accent))]",
      secondary: "bg-[hsl(var(--bg-elevated))] text-[hsl(var(--text-muted))] hover:bg-[hsl(var(--bg-elevated)/0.8)] hover:text-[hsl(var(--text))]",
      ghost: "hover:bg-[hsl(var(--accent)/0.1)] hover:text-[hsl(var(--accent))]",
      link: "text-[hsl(var(--primary))] underline-offset-4 hover:underline",
    }
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-md px-3",
      lg: "h-11 rounded-md px-8",
      icon: "h-10 w-10",
    }
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
export { Button }
