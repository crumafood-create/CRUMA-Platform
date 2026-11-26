'use client';

import { useState } from 'react';

type InventoryLocationFormProps = {
  action: (formData: FormData) => Promise<void>;
  location?: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    zone: string;
    aisle: number | null;
    rack: number | null;
    level: number | null;
    position: number | null;
    is_active: boolean;
    location_use: string | null;
    storage_condition: string | null;
  };
};

export default function InventoryLocationForm({
  action,
  location,
}: InventoryLocationFormProps) {
  const [loading, setLoading] =
    useState(false);

  return (
    <form
      action={async (
        formData,
      ) => {
        setLoading(true);

        try {
          await action(
            formData,
          );
        } finally {
          setLoading(false);
        }
      }}
      className="space-y-6"
    >
      {/* ===================================================== */}
      {/* INFORMACIÓN GENERAL */}
      {/* ===================================================== */}

      <div className="rounded-2xl border bg-white p-6 space-y-6">

        <h2 className="text-xl font-semibold">
          Información General
        </h2>

        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label className="block text-sm font-medium mb-2">
              Código
            </label>

            <input
              name="slug"
              required
              defaultValue={
                location?.slug
              }
              placeholder="A-01-01-01"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre
            </label>

            <input
              name="name"
              required
              defaultValue={
                location?.name
              }
              placeholder="Congelador A"
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Descripción
          </label>

          <textarea
            rows={3}
            name="description"
            defaultValue={
              location?.description ??
              ''
            }
            className="w-full rounded-lg border px-4 py-3"
          />
        </div>

      </div>

      <div className="rounded-2xl border bg-white p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Uso y conservación</h2>
          <p className="mt-1 text-sm text-gray-500">
            Clasifica explícitamente la ubicación. Los registros existentes permanecen sin clasificar hasta que el administrador los configure.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="location_use">
              Uso de la ubicación
            </label>
            <select
              id="location_use"
              name="location_use"
              defaultValue={location?.location_use ?? ''}
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="">Sin clasificar</option>
              <option value="raw_material">Materia prima</option>
              <option value="prepared_ingredient">Semielaborado / ingrediente preparado</option>
              <option value="finished_product">Producto terminado</option>
              <option value="packaging">Empaque</option>
              <option value="chemical">Químicos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" htmlFor="storage_condition">
              Condición de conservación
            </label>
            <select
              id="storage_condition"
              name="storage_condition"
              defaultValue={location?.storage_condition ?? ''}
              className="w-full rounded-lg border px-4 py-3"
            >
              <option value="">Sin clasificar</option>
              <option value="dry">Seco</option>
              <option value="refrigerated">Refrigerado</option>
              <option value="frozen">Congelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===================================================== */}
      {/* UBICACIÓN */}
      {/* ===================================================== */}

      <div className="rounded-2xl border bg-white p-6 space-y-6">

        <h2 className="text-xl font-semibold">
          Ubicación Física
        </h2>

        <div className="grid gap-6 md:grid-cols-5">

          <div>
            <label className="block text-sm font-medium mb-2">
              Zona
            </label>

            <input
              name="zone"
              required
              defaultValue={
                location?.zone
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Pasillo
            </label>

            <input
              type="number"
              min={0}
              name="aisle"
              defaultValue={
                location?.aisle ??
                0
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Rack
            </label>

            <input
              type="number"
              min={0}
              name="rack"
              defaultValue={
                location?.rack ??
                0
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Nivel
            </label>

            <input
              type="number"
              min={0}
              name="level"
              defaultValue={
                location?.level ??
                0
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Posición
            </label>

            <input
              type="number"
              min={0}
              name="position"
              defaultValue={
                location?.position ??
                0
              }
              className="w-full rounded-lg border px-4 py-3"
            />
          </div>

        </div>

      </div>

      {/* ===================================================== */}
      {/* ESTADO */}
      {/* ===================================================== */}

      <div className="rounded-2xl border bg-white p-6">

        <label className="flex items-center gap-3">

          <input
            type="checkbox"
            name="is_active"
            defaultChecked={
              location
                ? location.is_active
                : true
            }
          />

          <span>
            Ubicación activa
          </span>

        </label>

      </div>

      {/* ===================================================== */}
      {/* BOTONES */}
      {/* ===================================================== */}

      <div className="flex justify-end gap-3">

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
        >
          {loading
            ? 'Guardando...'
            : location
            ? 'Actualizar'
            : 'Guardar'}
        </button>

      </div>

    </form>
  );
}
