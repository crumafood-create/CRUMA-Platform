import { ReactNode } from 'react'

export interface TimelineItem {
  id: string

  title: string

  description?: string

  date?: string

  icon?: ReactNode
}

export interface TimelineProps {
  items: TimelineItem[]

  className?: string
}
