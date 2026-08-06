import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';

import { Button } from './button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Guardar cambios',
    variant: 'default',
    size: 'default',
  },
};

export const ClickInteraction: Story = {
  args: {
    children: 'Confirmar pedido',
    variant: 'default',
    size: 'default',
  },
  play: async ({
    args,
    canvas,
    userEvent,
  }) => {
    const button = canvas.getByRole('button', {
      name: 'Confirmar pedido',
    });

    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();

    await userEvent.click(button);

    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};

export const Disabled: Story = {
  args: {
    children: 'No disponible',
    disabled: true,
    variant: 'secondary',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', {
      name: 'No disponible',
    });

    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  },
};

export const AccessibilityCanaryRemediated: Story = {
  args: {
    children: '',
    'aria-label': 'Confirmar pedido',
    variant: 'default',
    size: 'default',
  },
  parameters: {
    a11y: {
      test: 'error',
    },
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', {
      name: 'Confirmar pedido',
    });

    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName(
      'Confirmar pedido'
    );
  },
};
