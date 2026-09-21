import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn } from 'storybook/test';

import { Button } from './button';

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: {
    a11y: {
      test: 'error',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Guardar',
    variant: 'default',
    size: 'default',
  },
};

export const Primary: Story = {
  args: {
    children: 'Guardar pedido',
    variant: 'primary',
    size: 'default',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Guardar borrador',
    variant: 'secondary',
    size: 'default',
  },
};

export const Outline: Story = {
  args: {
    children: 'Ver detalles',
    variant: 'outline',
    size: 'default',
  },
};

export const Small: Story = {
  args: {
    children: 'Pequeño',
    variant: 'primary',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    children: 'Mediano',
    variant: 'primary',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    children: 'Grande',
    variant: 'primary',
    size: 'lg',
  },
};

export const Loading: Story = {
  args: {
    children: (
      <>
        <span
          aria-hidden="true"
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
        Guardando
      </>
    ),
    variant: 'primary',
    disabled: true,
    'aria-label': 'Guardando',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', {
      name: 'Guardando',
    });

    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
  },
};

export const Hover: Story = {
  args: {
    children: 'Pasa el cursor',
    variant: 'primary',
  },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', {
      name: 'Pasa el cursor',
    });

    await userEvent.hover(button);
    await expect(button).toBeVisible();
  },
};

export const Focus: Story = {
  args: {
    children: 'Enfocado',
    variant: 'outline',
  },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', {
      name: 'Enfocado',
    });

    await userEvent.tab();
    await expect(button).toHaveFocus();
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
