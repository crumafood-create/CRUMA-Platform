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
interface ProductFormProps {
  action: (formData: FormData) => Promise<void>;
  categories?: SelectOption[];
  families?: SelectOption[];
  flavors?: SelectOption[];
  preparationTypes?: SelectOption[];
  unitsOfMeasure?: UnitOfMeasure[];
  initialValues?: {
    name?: string;
    slug?: string;
    internal_code?: string;
    category_id?: string;
    family_id?: string;
    flavor_id?: string;
    preparation_type_id?: string;
    short_description?: string;
    description?: string;
    image_url?: string;
    image_alt?: string;
    seo_title?: string;
    seo_description?: string;
    status?: string;
    is_featured?: boolean;
    min_stock?: number;
    unit_of_measure_id?: string;
  };
}

function generateInternalCode(
  name: string,
  prefix?: string
) {
  const cleanName = name.trim();

  if (!cleanName) {
    return '';
  }

  const code = toInternalCode(cleanName);

  return `${prefix ?? 'PRD'}-${code}`;
}

export function ProductForm({
  action,
  initialValues,
  categories,
  families,
  flavors,
  preparationTypes,
}: ProductFormProps) {
  const [slug, setSlug] = useState(initialValues?.slug ?? '');
  const [slugEdited, setSlugEdited] = useState(!!initialValues?.slug);

  const [productName, setProductName] = useState(
    initialValues?.name ?? ''
  );

  const [internalCode, setInternalCode] = useState(
    initialValues?.internal_code ?? ''
  );
  const [codeEdited, setCodeEdited] = useState(
    !!initialValues?.internal_code
  );

  const [selectedCategory, setSelectedCategory] = useState(
    initialValues?.category_id ?? ''
  );
  const [selectedFamily, setSelectedFamily] = useState(
    initialValues?.family_id ?? ''
  );

  const filteredFamilies =
    families?.filter(
      (family) => family.category_id === selectedCategory
    ) ?? [];

  const selectedCategoryPrefix =
    categories?.find(
      (category) => category.id === selectedCategory
    )?.code_prefix;

  function handleNameChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const value = e.target.value;

    setProductName(value);

    if (!slugEdited) {
      setSlug(toSlug(value));
    }

    if (!codeEdited) {
      setInternalCode(
        generateInternalCode(value, selectedCategoryPrefix)
      );
    }
  }

  function handleSlugChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setSlug(e.target.value);
    setSlugEdited(true);
  }

  function handleInternalCodeChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    setInternalCode(e.target.value);
    setCodeEdited(true);
  }

  function handleCategoryChange(
    e: ChangeEvent<HTMLSelectElement>
  ) {
    const categoryId = e.target.value;
    const categoryPrefix = categories?.find(
      (category) => category.id === categoryId
    )?.code_prefix;

    setSelectedCategory(categoryId);
    setSelectedFamily('');

    if (!codeEdited) {
      setInternalCode(
        generateInternalCode(productName, categoryPrefix)
      );
    }
  }

  function handleFamilyChange(
    e: ChangeEvent<HTMLSelectElement>
  ) {
    setSelectedFamily(e.target.value);
  }

  return (
    <form
      action={action}
      className="space-y-8 rounded-2xl border bg-white p-6"
    >
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
              defaultValue={initialValues?.name}
              onChange={handleNameChange}
              className="w-full rounded-lg border p-3"
              placeholder="Tequeños Tradicionales Queso"
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
              onChange={handleInternalCodeChange}
              className="w-full rounded-lg border p-3"
              placeholder="MP-AGUA"
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
              placeholder="tequenos-tradicionales-queso"
            />
            <p className="mt-1 text-xs text-gray-400">
              Se genera desde el nombre. Puedes editarlo manualmente.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Descripción corta
            </label>
            <textarea
              name="short_description"
              rows={2}
              defaultValue={initialValues?.short_description}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Descripción completa
            </label>
            <textarea
              name="description"
              rows={5}
              defaultValue={initialValues?.description}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Clasificación</h2>

        <div className="grid gap-4 md:grid-cols-2">
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
              <option value="">Seleccionar categoría</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
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
              onChange={handleFamilyChange}
              disabled={!selectedCategory}
              required
              className="w-full rounded-lg border p-3 disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {selectedCategory
                  ? 'Seleccionar familia'
                  : 'Primero selecciona una categoría'}
              </option>
              {filteredFamilies.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
            {!selectedCategory && (
              <p className="mt-1 text-xs text-gray-400">
                Selecciona una categoría para ver las familias disponibles.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Sabor
            </label>
            <select
              name="flavor_id"
              defaultValue={initialValues?.flavor_id ?? ''}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Seleccionar sabor</option>
              {flavors?.map((flavor) => (
                <option key={flavor.id} value={flavor.id}>
                  {flavor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Tipo Preparación
            </label>
            <select
              name="preparation_type_id"
              defaultValue={
                initialValues?.preparation_type_id ?? ''
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="">Seleccionar tipo</option>
              {preparationTypes?.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Imagen</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              URL Imagen
            </label>
            <input
              name="image_url"
              defaultValue={initialValues?.image_url}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Texto alternativo
            </label>
            <input
              name="image_alt"
              defaultValue={initialValues?.image_alt}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">SEO</h2>

        <div className="grid gap-4">
          <div>
            <label className="mb-2 block font-medium">
              SEO Title
            </label>
            <input
              name="seo_title"
              defaultValue={initialValues?.seo_title}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              SEO Description
            </label>
            <textarea
              name="seo_description"
              rows={3}
              defaultValue={initialValues?.seo_description}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Configuración</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              Estado
            </label>
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

          <div>
            <label className="mb-2 block font-medium">
              Stock Mínimo
            </label>
            <input
              type="number"
              name="min_stock"
              min={0}
              defaultValue={initialValues?.min_stock ?? 0}
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div className="flex items-center gap-3">
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
