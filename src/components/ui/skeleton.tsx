import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("adv-shimmer rounded-md border border-border/70", className)}
      {...props}
    />
  )
}

export { Skeleton }
