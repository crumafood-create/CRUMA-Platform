import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
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

  it('mueve el foco al abrir y lo devuelve al control invocador', () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Abrir edición</button>
          <Modal open={open} title="Editar" onOpenChange={setOpen}>Contenido</Modal>
        </>
      );
    }

    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Abrir edición' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(trigger).toHaveFocus();
  });
});
