import { DataListItem as Item } from './data-list.types'

interface Props {
  item: Item
}

export function DataListItem({
  item,
}: Props) {
  return (
    <div className="flex items-center gap-4 py-3">
      {item.icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          {item.icon}
        </div>
      )}

      <div className="flex-1">
        <h4 className="font-medium">
          {item.title}
        </h4>

        {item.description && (
          <p className="text-sm text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>

      {item.metadata && (
        <span className="text-xs text-muted-foreground">
          {item.metadata}
        </span>
      )}
    </div>
  )
}
