import { ReactNode } from 'react'

export interface ActivityItem {
  id: string

  actor: string

  action: string

  target?: string

  timestamp: string

  avatar?: ReactNode

  icon?: ReactNode
}

export interface ActivityFeedProps {
  items: ActivityItem[]

  className?: string
}
