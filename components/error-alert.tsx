"use client"

import { AlertTriangle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  variant?: "default" | "destructive"
}

export function ErrorAlert({ 
  title = "Something went wrong", 
  message, 
  onRetry, 
  onDismiss,
  className,
  variant = "destructive"
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  return (
    <div className={cn(
      "border rounded-lg p-4",
      variant === "destructive" 
        ? "bg-destructive/10 border-destructive/20 text-destructive" 
        : "bg-muted/50 border-border text-foreground",
      className
    )}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm opacity-90">{message}</p>
          <div className="flex space-x-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-8"
              >
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-8"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
