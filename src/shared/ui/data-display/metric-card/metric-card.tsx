import { TrendingDown, TrendingUp } from 'lucide-react'

import { cn } from '@/lib/utils'

import { MetricCardProps } from './metric-card.types'

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  loading = false,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          'rounded-xl border bg-card p-6 animate-pulse',
          className
        )}
      >
        <div className="h-4 w-24 rounded bg-muted mb-4" />
        <div className="h-8 w-32 rounded bg-muted mb-2" />
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-6 shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-2">
          {trend.value >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}

          <span
            className={cn(
              'text-sm font-medium',
              trend.value >= 0
                ? 'text-green-500'
                : 'text-red-500'
            )}
          >
            {trend.value}%
          </span>

          {trend.label && (
            <span className="text-sm text-muted-foreground">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
