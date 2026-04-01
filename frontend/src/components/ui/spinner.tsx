import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  className?: string
  size?: number
}

export function Spinner({ className, size = 24 }: SpinnerProps) {
  return <Loader2 className={cn("animate-spin text-primary", className)} size={size} />
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
      <div className="typing-dot h-2 w-2 rounded-full bg-muted-foreground" />
    </div>
  )
}
