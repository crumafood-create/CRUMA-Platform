'use client';

import { useState } from 'react';

import {
  toSlug,
} from '@/modules/inventory/application/utils/product-code';

interface Props {
  action: (formData: FormData) => Promise<void>;

  initialValues?: {
    name?: string;
    slug?: string;
    description?: string;
    status?: string;
  };
}

export function CategoryForm({
  action,
  initialValues,
}: Props) {
  const [slug, setSlug] =
  useState(
    initialValues?.slug ?? ''
  );

  return (
    <form
      action={action}
      className="space-y-6 rounded-2xl border p-6"
    >
      <div>
        <label>
          Nombre
        </label>

        <input
  name="name"
  required
  defaultValue={
    initialValues?.name
  }
  onChange={e =>
    setSlug(
      toSlug(e.target.value)
    )
  }
/>
      </div>

      <div>
        <label>
          Slug
        </label>

        <input
          name="slug"
          required
          value={slug}
          onChange={e =>
            setSlug(
              e.target.value
            )
          }
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label>
          Descripción
        </label>

        <textarea
          name="description"
          rows={3}
          className="w-full rounded border p-3"
        />
      </div>

      <div>
        <label>
          Estado
        </label>

        <select
          name="status"
          defaultValue="active"
          className="w-full rounded border p-3"
        >
          <option value="active">
            Activo
          </option>

          <option value="inactive">
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
