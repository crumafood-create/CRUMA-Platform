import { cn } from '@/lib/utils';

import { TimelineProps } from './timeline.types';
import { TimelineEntry } from './timeline-item';

export function Timeline({
  items,
  className,
}: TimelineProps) {
  return (
    <div className={cn(className)}>
      {items.map((item, index) => (
        <TimelineEntry
          key={item.id}
          item={item}
          isLast={index === items.length - 1}
        />
      ))}
    </div>
  );
}
