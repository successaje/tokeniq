"use client"

import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  className?: string
  indicatorClassName?: string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, ...props }, ref) => {
    const progress = Math.min(100, Math.max(0, value || 0))
    
    return (
      <div
        ref={ref}
        className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 ${className || ''}`}
        {...props}
      >
        <div
          className={`h-full rounded-full bg-primary transition-all duration-300 ease-in-out ${
            indicatorClassName || ''
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
