'use client';

import { useState } from 'react';

import { toSlug } from '@/modules/inventory/application/utils/product-code';

interface FamilyFormProps {
  action: (formData: FormData) => Promise<void>;

  categories: {
    id: string;
    name: string;
  }[];

  initialValues?: {
    category_id?: string;
    name?: string;
    slug?: string;
    description?: string;
    is_active?: boolean;
  };
}

export function FamilyForm({
  action,
  categories,
  initialValues,
}: FamilyFormProps) {
  const [slug, setSlug] = useState(
    initialValues?.slug ?? ''
  );

  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border p-6"
    >
      <div>
        <label className="mb-2 block font-medium">
          Categoría
        </label>

        <select
          name="category_id"
          defaultValue={
            initialValues?.category_id
          }
          className="w-full rounded border p-3"
          required
        >
          <option value="">
            Selecciona categoría
          </option>

          {categories.map(category => (
            <option
              key={category.id}
              value={category.id}
            >
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Nombre
        </label>

        <input
          name="name"
          required
          defaultValue={initialValues?.name}
          onChange={e =>
            setSlug(
              toSlug(e.target.value)
            )
          }
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Slug
        </label>

        <input
          name="slug"
          required
          value={slug}
          onChange={e =>
            setSlug(e.target.value)
          }
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Descripción
        </label>

        <textarea
          name="description"
          rows={3}
          defaultValue={
            initialValues?.description
          }
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">
          Estado
        </label>

        <select
          name="is_active"
          defaultValue={
            initialValues?.is_active
              ? 'true'
              : 'false'
          }
          className="w-full rounded border p-3"
        >
          <option value="true">
            Activo
          </option>

          <option value="false">
            Inactivo
          </option>
        </select>
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
