import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './modal';

describe('Modal', () => {
  it('expone semántica accesible y descripción', () => {
    render(
      <Modal
        open
        title="Confirmar liberación"
        description="Esta acción moverá el lote a inventario."
        onOpenChange={vi.fn()}
      >
        Detalle
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Confirmar liberación',
    });

    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Esta acción moverá el lote a inventario.'))
      .toBeVisible();
  });

  it('cierra con Escape y con el control accesible', () => {
    const onOpenChange = vi.fn();

    render(
      <Modal open title="Editar" onOpenChange={onOpenChange}>
        Formulario
      </Modal>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar modal' }));

    expect(onOpenChange).toHaveBeenNthCalledWith(1, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
  });

  it('no monta contenido cuando está cerrado', () => {
    render(
      <Modal open={false} title="Oculto" onOpenChange={vi.fn()}>
        Secreto
      </Modal>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
