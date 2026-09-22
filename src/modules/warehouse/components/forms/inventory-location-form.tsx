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
