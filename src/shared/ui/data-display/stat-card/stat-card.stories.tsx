import {
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'

import { StatCard } from './stat-card'

export default {
  title: 'Data Display/Stat Card',
  component: StatCard,
}

export const Default = {
  args: {
    title: 'Pedidos',
    value: 42,
  },
}

export const Success = {
  args: {
    title: 'Pedidos Entregados',
    value: 124,
    description: 'Últimos 30 días',
    variant: 'success',
    icon: <CheckCircle />,
  },
}

export const Warning = {
  args: {
    title: 'Pendientes',
    value: 18,
    description: 'Esperando aprobación',
    variant: 'warning',
    icon: <Clock />,
  },
}

export const Danger = {
  args: {
    title: 'Inventario Bajo',
    value: 8,
    description: 'Requiere reposición',
    variant: 'danger',
    icon: <AlertTriangle />,
  },
}
