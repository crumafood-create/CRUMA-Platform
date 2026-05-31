import { cn } from '@/lib/utils'

import { DataListItem } from './data-list-item'
import { DataListProps } from './data-list.types'

export function DataList({
  items,
  className,
}: DataListProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6',
        className
      )}
    >
      <div className="divide-y">
        {items.map((item) => (
          <DataListItem
            key={item.id}
            item={item}
          />
        ))}
      </div>
    </div>
  )
}
