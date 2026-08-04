import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Status } from './status';

const meta = {
  title: 'Data Display/Status',
  component: Status,
} satisfies Meta<typeof Status>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    label: 'Activo',
    variant: 'active',
  },
};

export const Pending: Story = {
  args: {
    label: 'Pendiente',
    variant: 'pending',
  },
};

export const Approved: Story = {
  args: {
    label: 'Aprobado',
    variant: 'approved',
  },
};

export const Rejected: Story = {
  args: {
    label: 'Rechazado',
    variant: 'rejected',
  },
};

export const Success: Story = {
  args: {
    label: 'Completado',
    variant: 'success',
  },
};

export const Danger: Story = {
  args: {
    label: 'Cancelado',
    variant: 'danger',
  },
};
