import Link from 'next/link';

export default function NewProductPage() {
  return (
    <main className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">
          Nuevo Producto
        </h1>

        <Link
          href="/products"
          className="rounded-lg border px-4 py-2"
        >
          Volver
        </Link>
      </div>

      <form className="space-y-6 rounded-2xl border p-6">
        {/* Nombre */}
        <div className="space-y-2">
          <label
            htmlFor="name"
            className="block text-sm font-medium"
          >
            Nombre
          </label>

          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Tequeños Tradicionales Queso Crudos"
          />
        </div>

        {/* Código interno */}
        <div className="space-y-2">
          <label
            htmlFor="internal_code"
            className="block text-sm font-medium"
          >
            Código Interno
          </label>

          <input
            id="internal_code"
            name="internal_code"
            type="text"
            required
            className="w-full rounded-lg border px-3 py-2"
            placeholder="TEQ-TRAD-QUESO-CRU"
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <label
            htmlFor="slug"
            className="block text-sm font-medium"
          >
            Slug
          </label>

          <input
            id="slug"
            name="slug"
            type="text"
            required
            className="w-full rounded-lg border px-3 py-2"
            placeholder="tequenos-tradicionales-queso-crudo"
          />
        </div>

        {/* Descripción corta */}
        <div className="space-y-2">
          <label
            htmlFor="short_description"
            className="block text-sm font-medium"
          >
            Descripción Corta
          </label>

          <textarea
            id="short_description"
            name="short_description"
            rows={3}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Producto congelado listo para freír."
          />
        </div>

        {/* Descripción completa */}
        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-medium"
          >
            Descripción
          </label>

          <textarea
            id="description"
            name="description"
            rows={5}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        {/* Imagen */}
        <div className="space-y-2">
          <label
            htmlFor="image_url"
            className="block text-sm font-medium"
          >
            URL Imagen
          </label>

          <input
            id="image_url"
            name="image_url"
            type="text"
            className="w-full rounded-lg border px-3 py-2"
            placeholder="https://..."
          />
        </div>

        {/* Alt imagen */}
        <div className="space-y-2">
          <label
            htmlFor="image_alt"
            className="block text-sm font-medium"
          >
            Texto Alternativo Imagen
          </label>

          <input
            id="image_alt"
            name="image_alt"
            type="text"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        {/* SEO */}
        <div className="space-y-2">
          <label
            htmlFor="seo_title"
            className="block text-sm font-medium"
          >
            SEO Title
          </label>

          <input
            id="seo_title"
            name="seo_title"
            type="text"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="seo_description"
            className="block text-sm font-medium"
          >
            SEO Description
          </label>

          <textarea
            id="seo_description"
            name="seo_description"
            rows={3}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        {/* Destacado */}
        <div className="flex items-center gap-2">
          <input
            id="is_featured"
            name="is_featured"
            type="checkbox"
          />

          <label htmlFor="is_featured">
            Producto destacado
          </label>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label
            htmlFor="status"
            className="block text-sm font-medium"
          >
            Estado
          </label>

          <select
            id="status"
            name="status"
            defaultValue="active"
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="active">
              Activo
            </option>

            <option value="inactive">
              Inactivo
            </option>

            <option value="draft">
              Borrador
            </option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg border px-6 py-2 font-medium"
        >
          Guardar Producto
        </button>
      </form>
    </main>
  );
}
