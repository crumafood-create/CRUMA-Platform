import { DollarSign } from 'lucide-react'

import { MetricCard } from './metric-card'

export default {
  title: 'Data Display/Metric Card',
  component: MetricCard,
}

export const Default = {
  args: {
    title: 'Ventas Hoy',
    value: '$24,500',
    subtitle: 'Comparado con ayer',
    icon: <DollarSign />,
  },
}

export const PositiveTrend = {
  args: {
    title: 'Pedidos',
    value: 325,
    trend: {
      value: 12,
      label: 'vs mes anterior',
    },
  },
}

export const NegativeTrend = {
  args: {
    title: 'Devoluciones',
    value: 18,
    trend: {
      value: -5,
      label: 'vs mes anterior',
    },
  },
}

export const Loading = {
  args: {
    loading: true,
  },
}
