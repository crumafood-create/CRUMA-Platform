import { ActivityItem as ActivityItemType } from './activity-feed.types';

interface Props {
  item: ActivityItemType;
}

export function ActivityFeedItem({
  item,
}: Props) {
  return (
    <div className="flex gap-4 py-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        {item.avatar || item.icon}
      </div>

      <div className="flex-1">
        <p className="text-sm">
          <span className="font-medium">
            {item.actor}
          </span>{' '}
          {item.action}{' '}
          {item.target && (
            <span className="font-medium">
              {item.target}
            </span>
          )}
        </p>

        <span className="text-xs text-muted-foreground">
          {item.timestamp}
        </span>
      </div>
    </div>
  );
}
