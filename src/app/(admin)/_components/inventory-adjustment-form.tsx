'use client';

import { useState } from 'react';

interface Item {
  id: string;
  name: string;
  internal_code: string | null;
}

interface Props {
  action: (
    formData: FormData
  ) => Promise<void>;

  products: Item[];
  materials: Item[];
}

export function InventoryAdjustmentForm({
  action,
  products,
  materials,
}: Props) {
  const [itemType, setItemType] =
    useState<
      'product' | 'raw_material'
    >('raw_material');

  const items =
    itemType === 'raw_material'
      ? materials
      : products;

  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border bg-white p-6"
    >
      <div>
        <label className="mb-2 block font-medium">
          Tipo de artículo
        </label>

        <select
          name="item_type"
          value={itemType}
          onChange={(e) =>
            setItemType(
              e.target
                .value as
                | 'product'
                | 'raw_material'
            )
          }
          className="w-full rounded border p-3"
        >
          <option value="raw_material">
            Materia Prima
          </option>

          <option value="product">
            Producto
          </option>
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Artículo
        </label>

        <select
          name="item_id"
          required
          className="w-full rounded border p-3"
        >
          <option value="">
            Seleccionar
          </option>

          {items.map((item) => (
            <option
              key={item.id}
              value={item.id}
            >
              {item.internal_code
                ? `${item.internal_code} - ${item.name}`
                : item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Movimiento
        </label>

        <select
          name="movement_type"
          required
          className="w-full rounded border p-3"
        >
          <option value="entry">
            Entrada
          </option>

          <option value="exit">
            Salida
          </option>

          <option value="adjustment">
            Ajuste
          </option>
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Cantidad
        </label>

        <input
          type="number"
          step="0.0001"
          min="0.0001"
          name="quantity"
          required
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Notas
        </label>

        <textarea
          name="notes"
          rows={3}
          className="w-full rounded border p-3"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg border bg-blue-50 px-6 py-3 font-medium text-blue-700 hover:bg-blue-100"
      >
        Guardar Ajuste
      </button>
    </form>
  );
}
