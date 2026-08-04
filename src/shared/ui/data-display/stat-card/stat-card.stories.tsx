import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

import { StatCard } from './stat-card';

const meta = {
  title: 'Data Display/Stat Card',
  component: StatCard,
} satisfies Meta<typeof StatCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Pedidos',
    value: 42,
  },
};

export const Success: Story = {
  args: {
    title: 'Pedidos Entregados',
    value: 124,
    description: 'Últimos 30 días',
    variant: 'success',
    icon: <CheckCircle />,
  },
};

export const Warning: Story = {
  args: {
    title: 'Pendientes',
    value: 18,
    description: 'Esperando aprobación',
    variant: 'warning',
    icon: <Clock />,
  },
};

export const Danger: Story = {
  args: {
    title: 'Inventario Bajo',
    value: 8,
    description: 'Requiere reposición',
    variant: 'danger',
    icon: <AlertTriangle />,
  },
};
