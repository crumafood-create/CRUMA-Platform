import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DollarSign } from 'lucide-react';

import { MetricCard } from './metric-card';

const meta = {
  title: 'Data Display/Metric Card',
  component: MetricCard,
} satisfies Meta<typeof MetricCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Ventas Hoy',
    value: '$24,500',
    subtitle: 'Comparado con ayer',
    icon: <DollarSign />,
  },
};

export const PositiveTrend: Story = {
  args: {
    title: 'Pedidos',
    value: 325,
    trend: {
      value: 12,
      label: 'vs mes anterior',
    },
  },
};

export const NegativeTrend: Story = {
  args: {
    title: 'Devoluciones',
    value: 18,
    trend: {
      value: -5,
      label: 'vs mes anterior',
    },
  },
};

export const Loading: Story = {
  args: {
    title: 'Ventas Hoy',
    value: '$24,500',
    loading: true,
  },
};
