'use client';

import { useState } from 'react';

export function RecipeItemsForm({
  materials,
}: {
  materials: {
    id: string;
    name: string;
  }[];
}) {
  const [items, setItems] = useState([
    {
      materialId: '',
      quantity: '',
    },
  ]);

  function addRow() {
    setItems([
      ...items,
      {
        materialId: '',
        quantity: '',
      },
    ]);
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-2 gap-4"
        >
          <select
            name={`material_${index}`}
            className="rounded border p-2"
          >
            <option value="">
              Ingrediente
            </option>

            {materials.map(
              (material) => (
                <option
                  key={material.id}
                  value={material.id}
                >
                  {material.name}
                </option>
              )
            )}
          </select>

          <input
            name={`quantity_${index}`}
            placeholder="Cantidad"
            className="rounded border p-2"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="rounded border px-4 py-2"
      >
        + Ingrediente
      </button>
    </div>
  );
}
