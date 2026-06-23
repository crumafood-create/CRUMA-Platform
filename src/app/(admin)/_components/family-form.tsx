'use client';

import { useState, type ChangeEvent } from 'react';

import {
  toSlug,
  toFamilyCode,
} from '@/modules/inventory/application/utils/family-code';

interface FamilyFormProps {
  action: (formData: FormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  familyId?: string;
  categories: {
    id: string;
    name: string;
  }[];
  initialValues?: {
    category_id?: string;
    name?: string;
    slug?: string;
    internal_code?: string;
    description?: string;
    is_active?: boolean;
  };
}

export function FamilyForm({
  action,
  onDelete,
  familyId,
  categories,
  initialValues,
}: FamilyFormProps) {
  const [slug, setSlug] = useState(initialValues?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(!!initialValues?.slug);
  const [internalCode, setInternalCode] = useState(
    initialValues?.internal_code ?? ''
  );
  const [codeEdited, setCodeEdited] = useState(
    !!initialValues?.internal_code
  );
  const [isDeletePending, setIsDeletePending] = useState(false);

  function handleNameChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (!slugEdited) {
      setSlug(toSlug(value));
    }
    if (!codeEdited) {
      setInternalCode(toFamilyCode(value));
    }
  }

  function handleSlugChange(e: ChangeEvent<HTMLInputElement>) {
    setSlug(e.target.value);
    setSlugEdited(true);
  }

  function handleInternalCodeChange(e: ChangeEvent<HTMLInputElement>) {
    setInternalCode(e.target.value);
    setCodeEdited(true);
  }

  async function handleDelete() {
    if (!familyId || !onDelete) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que quieres eliminar esta familia? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    setIsDeletePending(true);

    try {
      await onDelete(familyId);
    } catch (error) {
      setIsDeletePending(false);
      alert(
        `Error al eliminar: ${
          error instanceof Error ? error.message : 'Intenta de nuevo'
        }`
      );
    }
  }

  return (
    <form action={action} className="space-y-8 rounded-2xl border bg-white p-6">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Información General</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">Categoría *</label>
            <select
              name="category_id"
              defaultValue={initialValues?.category_id ?? ''}
              className="w-full rounded-lg border p-3"
              required
            >
              <option value="">Selecciona categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">Nombre *</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={initialValues?.name ?? ''}
              onChange={handleNameChange}
              className="w-full rounded-lg border p-3"
              placeholder="Tequeños Tradicionales"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Código Interno *</label>
            <input
              type="text"
              name="internal_code"
              required
              value={internalCode}
              onChange={handleInternalCodeChange}
              className="w-full rounded-lg border p-3"
              placeholder="TEQUE-TRAD"
            />
            <p className="mt-1 text-xs text-gray-400">
              Se genera desde el nombre. Puedes editarlo manualmente.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-medium">Slug *</label>
            <input
              name="slug"
              type="text"
              required
              value={slug}
              onChange={handleSlugChange}
              className="w-full rounded-lg border p-3"
              placeholder="tequeños-tradicionales"
            />
            <p className="mt-1 text-xs text-gray-400">
              Se genera desde el nombre. Puedes editarlo manualmente.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">Descripción</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={initialValues?.description ?? ''}
              className="w-full rounded-lg border p-3"
              placeholder="Describe esta familia de productos..."
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Configuración</h2>

        <div className="flex items-center gap-3">
          <select
            name="is_active"
            defaultValue={initialValues?.is_active === false ? 'false' : 'true'}
            className="rounded-lg border p-3"
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
          <span className="text-sm text-gray-600">Estado de la familia</span>
        </div>
      </section>

      <div className="border-t pt-6">
        <button
          type="submit"
          className="rounded-lg border bg-blue-50 px-6 py-3 font-medium text-blue-700 hover:bg-blue-100"
        >
          Guardar Familia
        </button>
      </div>

      {familyId && onDelete && (
        <div className="border-t pt-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h3 className="mb-3 font-semibold text-red-900">Zona Peligrosa</h3>
            <p className="mb-4 text-sm text-red-700">
              Eliminar esta familia es permanente. No se puede deshacer.
            </p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeletePending}
              className="rounded-lg border border-red-300 bg-red-100 px-6 py-2 font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              {isDeletePending ? 'Eliminando...' : 'Eliminar Familia'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
      }
