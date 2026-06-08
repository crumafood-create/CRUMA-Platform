'use client';

import { useState } from 'react';

import {
  toSlug,
  toInternalCode,
} from '@/modules/inventory/application/utils/product-code';

interface ProductFormProps {
  action: (formData: FormData) => Promise<void>;
}

export function ProductForm({ action }: ProductFormProps) {
  const [slug, setSlug] =
  useState('');

const [slugEdited, setSlugEdited] =
  useState(false);

const [internalCode, setInternalCode] =
  useState('');
  
  function handleNameChange(
  e: React.ChangeEvent<HTMLInputElement>
) {
  const value = e.target.value;

  if (!slugEdited) {
    setSlug(toSlug(value));
  }

  setInternalCode(
    toInternalCode(value)
  );
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value);
    setSlugEdited(true); // a partir de aquí el slug es manual
  }

  return (
    <form action={action} className="space-y-8 rounded-2xl border bg-white p-6">

      {/* INFORMACIÓN GENERAL */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Información General</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Nombre *</label>
            <input
              name="name"
              required
              onChange={handleNameChange}
              className="w-full rounded-lg border p-3"
              placeholder="Tequeños Tradicionales Queso"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Código Interno</label>
            <input
  name="internal_code"
  value={internalCode}
  onChange={e =>
    setInternalCode(e.target.value)
  }
  className="w-full rounded-lg border p-3"
  placeholder="TEQ-TRAD-QUESO"
/>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Slug *</label>
            <input
              name="slug"
              required
              value={slug}
              onChange={handleSlugChange}
              className="w-full rounded-lg border p-3"
              placeholder="tequenos-tradicionales-queso"
            />
            <p className="mt-1 text-xs text-gray-400">
              Se genera solo desde el nombre. Puedes editarlo manualmente.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Descripción corta</label>
            <textarea
              name="short_description"
              rows={2}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Descripción completa</label>
            <textarea
              name="description"
              rows={5}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      {/* IMAGEN */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Imagen</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">URL Imagen</label>
            <input name="image_url" className="w-full rounded-lg border p-3" />
          </div>

          <div>
            <label className="mb-2 block font-medium">Texto alternativo</label>
            <input name="image_alt" className="w-full rounded-lg border p-3" />
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">SEO</h2>

        <div className="grid gap-4">
          <div>
            <label className="mb-2 block font-medium">SEO Title</label>
            <input name="seo_title" className="w-full rounded-lg border p-3" />
          </div>

          <div>
            <label className="mb-2 block font-medium">SEO Description</label>
            <textarea
              name="seo_description"
              rows={3}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      {/* CONFIGURACIÓN */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Configuración</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Estado</label>
            <select
              name="status"
              defaultValue="active"
              className="w-full rounded-lg border p-3"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="draft">Borrador</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-9">
            <input type="checkbox" name="is_featured" />
            <span>Producto destacado</span>
          </div>
        </div>
      </section>

      <div className="border-t pt-6">
        <button
          type="submit"
          className="rounded-lg border px-6 py-3 font-medium"
        >
          Guardar Producto
        </button>
      </div>
    </form>
  );
      }
