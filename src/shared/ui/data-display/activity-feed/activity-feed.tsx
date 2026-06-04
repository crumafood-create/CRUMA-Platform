import { cn } from '@/lib/utils';

import { ActivityFeedItem } from './activity-item';
import { ActivityFeedProps } from './activity-feed.types';

export function ActivityFeed({
  items,
  className,
}: ActivityFeedProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6',
        className
      )}
    >
      <div className="mb-4">
        <h3 className="font-semibold">
          Actividad Reciente
        </h3>
      </div>

      <div className="divide-y">
        {items.map((item) => (
          <ActivityFeedItem
            key={item.id}
            item={item}
          />
        ))}
      </div>
    </div>
  );
}
