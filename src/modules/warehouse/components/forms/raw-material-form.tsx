'use client';

import {
  useState,
  useTransition,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { FormError } from '@/shared/ui/forms/field-error/form-error';

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

interface InventoryLocationOption {
  id: string;
  slug: string;
  name: string;
  location_use: string | null;
  storage_condition: string | null;
}

interface RawMaterialFormProps {
  action: (formData: FormData) => Promise<void>;

  categories?: SelectOption[];
  families?: SelectOption[];
  unitsOfMeasure?: UnitOfMeasure[];
  inventoryLocations?: InventoryLocationOption[];

  initialValues?: {
    name?: string;
    slug?: string;
    internal_code?: string;
    last_cost?: number;

    category_id?: string;
    family_id?: string;
    unit_of_measure_id?: string;

    current_stock?: number;
    minimum_stock?: number;
    average_cost?: number;
    required_storage_condition?: string;
    default_storage_use?: string;
    default_inventory_location_id?: string;

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

const knownCreationErrors = new Set([
  'La familia de una materia prima requiere una categoría.',
  'La familia no pertenece a la categoría seleccionada.',
  'Familia de materia prima no encontrada.',
  'Configura juntos el uso y la condición de conservación.',
  'La condición del ingrediente debe ser seco o refrigerado.',
  'El uso del destino debe ser materia prima o ingrediente preparado.',
  'Configura el uso y la condición antes de asignar una ubicación habitual.',
]);

function getCreationErrorMessage(error: unknown): string {
  if (error instanceof Error && knownCreationErrors.has(error.message)) {
    return error.message;
  }

  return 'No fue posible guardar la materia prima. Revisa los datos e inténtalo de nuevo.';
}

export function RawMaterialForm({
  action,
  categories,
  families,
  unitsOfMeasure,
  inventoryLocations,
  initialValues,
}: RawMaterialFormProps) {
  const [materialName, setMaterialName] = useState(
    initialValues?.name ?? ''
  );

  const [slug, setSlug] = useState(
    initialValues?.slug ?? ''
  );

  const [slugEdited, setSlugEdited] = useState(
    !!initialValues?.slug
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
  const [selectedStorageCondition, setSelectedStorageCondition] = useState(
    initialValues?.required_storage_condition ?? '',
  );
  const [selectedStorageUse, setSelectedStorageUse] = useState(
    initialValues?.default_storage_use ?? '',
  );
  const [selectedDefaultLocation, setSelectedDefaultLocation] = useState(
    initialValues?.default_inventory_location_id ?? '',
  );
  const [error, setError] = useState('');
  const [, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError('');
    startTransition(async () => {
      try {
        await action(formData);
      } catch (actionError) {
        setError(getCreationErrorMessage(actionError));
      }
    });
  }

  const filteredFamilies =
    families?.filter(
      (family) =>
        family.category_id === selectedCategory
    ) ?? [];

  const selectedCategoryPrefix = categories?.find(
    (category) =>
      category.id === selectedCategory
  )?.code_prefix;

  const compatibleInventoryLocations = inventoryLocations?.filter((location) =>
    location.location_use === selectedStorageUse
      && location.storage_condition === selectedStorageCondition,
  ) ?? [];

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

    const prefix = categories?.find(
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
      onSubmit={handleSubmit}
      className="space-y-8 rounded-2xl border bg-white p-6"
    >
      {error ? (
        <div role="alert">
          <FormError message={error} />
        </div>
      ) : null}

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
              defaultValue={initialValues?.description ?? ''}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

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
                setSelectedFamily(e.target.value)
              }
              disabled={!selectedCategory}
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                Seleccionar familia
              </option>

              {filteredFamilies.map((family) => (
                <option
                  key={family.id}
                  value={family.id}
                >
                  {family.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Unidad
            </label>

            <select
              name="unit_of_measure_id"
              required={!initialValues}
              defaultValue={
                initialValues?.unit_of_measure_id ?? ''
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="">
                Seleccionar unidad
              </option>

              {unitsOfMeasure?.map((unit) => (
                <option
                  key={unit.id}
                  value={unit.id}
                >
                  {unit.code} - {unit.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

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
              defaultValue={initialValues?.current_stock ?? 0}
              readOnly
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
              defaultValue={initialValues?.minimum_stock ?? 0}
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
              defaultValue={initialValues?.average_cost ?? 0}
              readOnly
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
              readOnly={Boolean(initialValues)}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Configuración
        </h2>

        <div className="rounded-lg border p-4 space-y-4">
          <div>
            <h3 className="font-semibold">Conservación y destino habitual</h3>
            <p className="text-sm text-gray-600">
              Configura una condición y un uso compatibles. El destino aparece cuando una ubicación activa tiene la misma clasificación; no se deduce por su nombre.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block font-medium" htmlFor="required_storage_condition">
                Condición aprobada
              </label>
              <select
                id="required_storage_condition"
                name="required_storage_condition"
                value={selectedStorageCondition}
                onChange={(event) => {
                  setSelectedStorageCondition(event.target.value);
                  setSelectedDefaultLocation('');
                }}
                className="w-full rounded-lg border p-3"
              >
                <option value="">Pendiente de configurar</option>
                <option value="dry">Seco</option>
                <option value="refrigerated">Refrigerado</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium" htmlFor="default_storage_use">
                Uso de la ubicación
              </label>
              <select
                id="default_storage_use"
                name="default_storage_use"
                value={selectedStorageUse}
                onChange={(event) => {
                  setSelectedStorageUse(event.target.value);
                  setSelectedDefaultLocation('');
                }}
                className="w-full rounded-lg border p-3"
              >
                <option value="">Pendiente de configurar</option>
                <option value="raw_material">Materia prima</option>
                <option value="prepared_ingredient">Ingrediente preparado</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block font-medium" htmlFor="default_inventory_location_id">
                Destino habitual
              </label>
              <select
                id="default_inventory_location_id"
                name="default_inventory_location_id"
                value={selectedDefaultLocation}
                onChange={(event) => setSelectedDefaultLocation(event.target.value)}
                disabled={!selectedStorageCondition || !selectedStorageUse}
                className="w-full rounded-lg border p-3 disabled:bg-gray-100"
              >
                <option value="">Sin destino asignado</option>
                {compatibleInventoryLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} · {location.slug}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedStorageCondition && selectedStorageUse && compatibleInventoryLocations.length === 0 && (
            <p className="text-sm text-amber-700">
              No hay una ubicación activa compatible. Clasifica primero una ubicación en{' '}
              <a href="/inventory-locations" className="underline">Ubicaciones</a>.
            </p>
          )}
        </div>

        <select
          name="is_active"
          defaultValue={
            initialValues?.is_active ? 'true' : 'false'
          }
          className="w-full rounded-lg border p-3"
        >
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
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

