import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormInput } from './form-input';
import { FormSelect } from './form-select';
import { FormTextarea } from './form-textarea';

describe('form controls accessibility', () => {
  it('uses keyboard-specific focus styles without hiding the native outline globally', () => {
    render(
      <>
        <label htmlFor="name">Nombre</label>
        <FormInput id="name" />
        <label htmlFor="status">Estado</label>
        <FormSelect id="status">
          <option>Activo</option>
        </FormSelect>
        <label htmlFor="notes">Notas</label>
        <FormTextarea id="notes" />
      </>,
    );

    for (const control of [
      screen.getByLabelText('Nombre'),
      screen.getByLabelText('Estado'),
      screen.getByLabelText('Notas'),
    ]) {
      expect(control).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-brand-blue');
      expect(control).not.toHaveClass('focus:ring-black');
    }
  });
});
