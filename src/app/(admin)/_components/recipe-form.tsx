'use client';

import { useState } from 'react';

import {
  toSlug,
  toInternalCode,
} from '@/modules/inventory/application/utils/product-code';

interface Unit {
  id: string;
  name: string;
  code: string;
}

interface Props {
  action: (formData: FormData) => Promise<void>;

  unitsOfMeasure: Unit[];

  initialValues?: {
    name?: string;
    slug?: string;
    internal_code?: string;
    description?: string;
    yield_quantity?: number;
    unit_of_measure_id?: string;
    is_active?: boolean;
  };
}

export function RecipeForm({
  action,
  unitsOfMeasure,
  initialValues,
}: Props) {
  const [slug, setSlug] =
    useState(initialValues?.slug ?? '');

  const [code, setCode] =
    useState(
      initialValues?.internal_code ?? ''
    );

  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border p-6"
    >
      <div>
        <label>Nombre</label>

        <input
          name="name"
          required
          defaultValue={
            initialValues?.name
          }
          onChange={(e) => {
            setSlug(
              toSlug(e.target.value)
            );

            setCode(
              `REC-${toInternalCode(
                e.target.value
              )}`
            );
          }}
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label>Código</label>

        <input
          name="internal_code"
          value={code}
          onChange={(e) =>
            setCode(e.target.value)
          }
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label>Slug</label>

        <input
          name="slug"
          value={slug}
          onChange={(e) =>
            setSlug(e.target.value)
          }
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label>Rendimiento</label>

        <input
          type="number"
          step="0.001"
          name="yield_quantity"
          defaultValue={
            initialValues?.yield_quantity ?? 1
          }
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label>Unidad</label>

        <select
          name="unit_of_measure_id"
          className="w-full rounded border p-3"
          defaultValue={
            initialValues?.unit_of_measure_id
          }
        >
          <option value="">
            Seleccionar
          </option>

          {unitsOfMeasure.map(
            (unit) => (
              <option
                key={unit.id}
                value={unit.id}
              >
                {unit.code} - {unit.name}
              </option>
            )
          )}
        </select>
      </div>

      <div>
        <label>Descripción</label>

        <textarea
          name="description"
          rows={4}
          className="w-full rounded border p-3"
          defaultValue={
            initialValues?.description
          }
        />
      </div>

      <button
        type="submit"
        className="rounded border px-6 py-2"
      >
        Guardar
      </button>
    </form>
  );
          }
