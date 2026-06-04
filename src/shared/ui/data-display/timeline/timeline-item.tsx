import { TimelineItem as TimelineItemType } from './timeline.types';

interface Props {
  item: TimelineItemType;
  isLast?: boolean;
}

export function TimelineEntry({
  item,
  isLast = false,
}: Props) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="h-3 w-3 rounded-full bg-primary" />

        {!isLast && (
          <div className="mt-1 h-full w-px bg-border" />
        )}
      </div>

      <div className="pb-8">
        <div className="flex items-center gap-2">
          {item.icon}

          <h4 className="font-medium">
            {item.title}
          </h4>
        </div>

        {item.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {item.description}
          </p>
        )}

        {item.date && (
          <span className="mt-2 block text-xs text-muted-foreground">
            {item.date}
          </span>
        )}
      </div>
    </div>
  );
}
