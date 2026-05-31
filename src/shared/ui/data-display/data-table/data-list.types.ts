import { ReactNode } from 'react'

export interface DataListItem {
  id: string

  title: string

  description?: string

  metadata?: string

  icon?: ReactNode
}

export interface DataListProps {
  items: DataListItem[]

  className?: string
}
