'use client';

import { useState, type ChangeEvent } from 'react';

import {
  toSlug,
  toInternalCode,
} from '@/modules/inventory/application/utils/product-code';

interface SelectOption {
  id: string;
  name: string;
  category_id?: string;
  code_prefix?: string;
}

interface UnitOfMeasure {
  id: string;
  name: string;
  code: string;
}

interface RawMaterialFormProps {
  action: (formData: FormData) => Promise<void>;

  categories?: SelectOption[];
  families?: SelectOption[];
  unitsOfMeasure?: UnitOfMeasure[];

  initialValues?: {
    name?: string;
    slug?: string;
    internal_code?: string;

    category_id?: string;
    family_id?: string;
    unit_of_measure_id?: string;

    current_stock?: number;
    minimum_stock?: number;
    average_cost?: number;

    description?: string;

    is_active?: boolean;
  };
}

function generateInternalCode(
  name: string,
  prefix?: string
): string {
  const cleanName = name.trim();

  if (!cleanName) {
    return '';
  }

  return `${prefix ?? 'MP'}-${toInternalCode(cleanName)}`;
}

export function RawMaterialForm({
  action,
  categories,
  families,
  unitsOfMeasure,
  initialValues,
}: RawMaterialFormProps) {
  const [materialName, setMaterialName] =
    useState(initialValues?.name ?? '');

  const [slug, setSlug] =
    useState(initialValues?.slug ?? '');

  const [slugEdited, setSlugEdited] =
    useState(!!initialValues?.slug);

  const [internalCode, setInternalCode] =
    useState(initialValues?.internal_code ?? '');

  const [codeEdited, setCodeEdited] =
    useState(!!initialValues?.internal_code);

  const [selectedCategory, setSelectedCategory] =
    useState(initialValues?.category_id ?? '');

  const [selectedFamily, setSelectedFamily] =
    useState(initialValues?.family_id ?? '');

  const filteredFamilies =
    families?.filter(
      (family) =>
        family.category_id === selectedCategory
    ) ?? [];

  const selectedCategoryPrefix =
    categories?.find(
      (category) =>
        category.id === selectedCategory
    )?.code_prefix;

  function handleNameChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const value = e.target.value;

    setMaterialName(value);

    if (!slugEdited) {
      setSlug(toSlug(value));
    }

    if (!codeEdited) {
      setInternalCode(
        generateInternalCode(
          value,
          selectedCategoryPrefix
        )
      );
    }
  }

  function handleSlugChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setSlug(e.target.value);
    setSlugEdited(true);
  }

  function handleCodeChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setInternalCode(e.target.value);
    setCodeEdited(true);
  }

  function handleCategoryChange(
    e: ChangeEvent<HTMLSelectElement>
  ) {
    const categoryId = e.target.value;

    const prefix =
      categories?.find(
        (category) =>
          category.id === categoryId
      )?.code_prefix;

    setSelectedCategory(categoryId);
    setSelectedFamily('');

    if (!codeEdited) {
      setInternalCode(
        generateInternalCode(
          materialName,
          prefix
        )
      );
    }
  }

  return (
    <form
      action={action}
      className="space-y-8 rounded-2xl border bg-white p-6"
    >
      {/* GENERAL */}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Información General
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              Nombre *
            </label>

            <input
              name="name"
              required
              value={materialName}
              onChange={handleNameChange}
              className="w-full rounded-lg border p-3"
              placeholder="Harina de Trigo"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Código Interno *
            </label>

            <input
              name="internal_code"
              required
              value={internalCode}
              onChange={handleCodeChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Slug *
            </label>

            <input
              name="slug"
              required
              value={slug}
              onChange={handleSlugChange}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Descripción
            </label>

            <textarea
              name="description"
              rows={4}
              defaultValue={
                initialValues?.description
              }
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      {/* CLASIFICACIÓN */}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Clasificación
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block font-medium">
              Categoría
            </label>

            <select
              name="category_id"
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                Seleccionar categoría
              </option>

              {categories?.map((category) => (
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
              Familia
            </label>

            <select
              name="family_id"
              value={selectedFamily}
              onChange={(e) =>
                setSelectedFamily(
                  e.target.value
                )
              }
              disabled={!selectedCategory}
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                Seleccionar familia
              </option>

              {filteredFamilies.map(
                (family) => (
                  <option
                    key={family.id}
                    value={family.id}
                  >
                    {family.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Unidad
            </label>

            <select
              name="unit_of_measure_id"
              defaultValue={
                initialValues?.unit_of_measure_id ??
                ''
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                Seleccionar unidad
              </option>

              {unitsOfMeasure?.map(
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
        </div>
      </section>

      {/* INVENTARIO */}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Inventario
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block font-medium">
              Stock Actual
            </label>

            <input
              type="number"
              step="0.0001"
              name="current_stock"
              defaultValue={
                initialValues?.current_stock ?? 0
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Stock Mínimo
            </label>

            <input
              type="number"
              step="0.0001"
              name="minimum_stock"
              defaultValue={
                initialValues?.minimum_stock ?? 0
              }
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Costo Promedio
            </label>

            <input
              type="number"
              step="0.0001"
              name="average_cost"
              defaultValue={
                initialValues?.average_cost ?? 0
              }
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-medium">
              Último Costo
            </label>

            <input
              type="number"
              step="0.0001"
              name="last_cost"
              defaultValue={initialValues?.last_cost ?? 0}
              className="w-full rounded border p-3"
            />
        </div>
        </div>
      </section>

      {/* CONFIGURACIÓN */}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Configuración
        </h2>

        <select
          name="is_active"
          defaultValue={
            initialValues?.is_active
              ? 'true'
              : 'false'
          }
          className="w-full rounded-lg border p-3"
        >
          <option value="true">
            Activo
          </option>

          <option value="false">
            Inactivo
          </option>
        </select>
      </section>

      <div className="border-t pt-6">
        <button
          type="submit"
          className="rounded-lg border px-6 py-3 font-medium"
        >
          Guardar Materia Prima
        </button>
      </div>
    </form>
  );
      }
