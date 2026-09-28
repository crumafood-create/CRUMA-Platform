import {
  render,
  screen,
} from '@testing-library/react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  RawMaterialQualityInspectionForm,
} from './raw-material-quality-inspection-form';

vi.mock(
  '@/app/(admin)/qa/actions',
  () => ({
    recordRawMaterialQualityInspection:
      vi.fn(),
  }),
);

const LOT_ID =
  'a1000000-0000-0000-0000-000000000001';

describe(
  'RawMaterialQualityInspectionForm',
  () => {
    it(
      'permite inspeccionar cantidades decimales de un lote',
      () => {
        const { container } = render(
          <RawMaterialQualityInspectionForm
            lots={[
              {
                id: LOT_ID,
                label:
                  'Harina (MP-HARINA) · lote H-001 · Cuarentena',
                quantity: 25.75,
              },
            ]}
            initialLotId={LOT_ID}
          />,
        );

        const lot = screen.getByRole(
          'combobox',
          {
            name: 'Lote de materia prima',
          },
        );

        expect(lot).toBeRequired();
        expect(lot).toHaveValue(LOT_ID);

        expect(
          screen.getByRole('option', {
            name:
              /Harina \(MP-HARINA\).*25\.75/,
          }),
        ).toBeInTheDocument();

        const sampledQuantity =
          screen.getByRole(
            'spinbutton',
            {
              name: 'Cantidad muestreada',
            },
          );

        expect(sampledQuantity).toBeRequired();
        expect(sampledQuantity).toHaveAttribute(
          'min',
          '0.0001',
        );
        expect(sampledQuantity).toHaveAttribute(
          'step',
          '0.0001',
        );

        const defectQuantity =
          container.querySelector(
            'input[name="defect_quantity"]',
          );

        expect(defectQuantity).not.toBeNull();
        expect(defectQuantity).toHaveAttribute(
          'min',
          '0.0001',
        );
        expect(defectQuantity).toHaveAttribute(
          'step',
          '0.0001',
        );

        expect(
          screen.getByRole('button', {
            name: 'Registrar y evaluar',
          }),
        ).toHaveAttribute('type', 'submit');
      },
    );
  },
);