'use client';

import { useState } from 'react';

import {
  toSlug,
  toInternalCode,
} from '@/modules/inventory/application/utils/product-code';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  action: (formData: FormData) => Promise<void>;
  initialValues?: {
    name?: string;
    slug?: string;
    internal_code?: string;
    short_description?: string;
    description?: string;
    image_url?: string;
    image_alt?: string;
    seo_title?: string;
    seo_description?: string;
    status?: string;
    is_featured?: boolean;
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProductForm({ action, initialValues }: ProductFormProps) {
  const [slug, setSlug]             = useState(initialValues?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(!!initialValues?.slug);
  const [internalCode, setInternalCode] = useState(initialValues?.internal_code ?? '');
  const [codeEdited, setCodeEdited]     = useState(!!initialValues?.internal_code);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (!slugEdited) setSlug(toSlug(value));
    if (!codeEdited) setInternalCode(toInternalCode(value));
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value);
    setSlugEdited(true);
  }

  function handleInternalCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInternalCode(e.target.value);
    setCodeEdited(true);
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
              defaultValue={initialValues?.name}
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
              onChange={handleInternalCodeChange}
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
              Se genera desde el nombre. Puedes editarlo manualmente.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Descripción corta</label>
            <textarea
              name="short_description"
              rows={2}
              defaultValue={initialValues?.short_description}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Descripción completa</label>
            <textarea
              name="description"
              rows={5}
              defaultValue={initialValues?.description}
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
            <input
              name="image_url"
              defaultValue={initialValues?.image_url}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Texto alternativo</label>
            <input
              name="image_alt"
              defaultValue={initialValues?.image_alt}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">SEO</h2>

        <div className="grid gap-4">
          <div>
            <label className="mb-2 block font-medium">SEO Title</label>
            <input
              name="seo_title"
              defaultValue={initialValues?.seo_title}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">SEO Description</label>
            <textarea
              name="seo_description"
              rows={3}
              defaultValue={initialValues?.seo_description}
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
              defaultValue={initialValues?.status ?? 'active'}
              className="w-full rounded-lg border p-3"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="draft">Borrador</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-9">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={initialValues?.is_featured}
            />
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
