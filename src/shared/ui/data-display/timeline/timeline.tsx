import { cn } from '@/lib/utils'

import { TimelineProps } from './timeline.types'
import { TimelineItem } from './timeline-item'

export function Timeline({
  items,
  className,
}: TimelineProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6',
        className
      )}
    >
      {items.map((item, index) => (
        <TimelineItem
          key={item.id}
          item={item}
          isLast={index === items.length - 1}
        />
      ))}
    </div>
  )
}
