import type { PublicTableRow } from '@/infrastructure/integrations/supabase/database.types';

type Product = PublicTableRow<'products'>;
type Publication = PublicTableRow<'storefront_products'>;

export function StorefrontPublicationForm({
  action,
  product,
  publication,
}: {
  action: (formData: FormData) => Promise<void>;
  product: Product;
  publication: Publication | null;
}) {
  return (
    <form action={action} className="space-y-6 rounded-2xl border bg-white p-6">
      <div>
        <h2 className="text-2xl font-bold">Ficha pública</h2>
        <p className="mt-1 text-sm text-gray-500">Solo estos datos quedan disponibles para visitantes.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="block font-medium">Nombre público *</span>
          <input name="name" required defaultValue={publication?.name ?? product.name} className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2">
          <span className="block font-medium">Slug público *</span>
          <input name="slug" required defaultValue={publication?.slug ?? product.slug} className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2">
          <span className="block font-medium">Categoría pública *</span>
          <input name="category_name" required defaultValue={publication?.category_name ?? ''} className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2">
          <span className="block font-medium">Slug de categoría *</span>
          <input name="category_slug" required defaultValue={publication?.category_slug ?? ''} className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2">
          <span className="block font-medium">Presentación *</span>
          <input name="presentation" required defaultValue={publication?.presentation ?? ''} placeholder="Caja con 12 piezas" className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2">
          <span className="block font-medium">Precio público MXN *</span>
          <input name="price" type="number" min="0" step="0.01" required defaultValue={publication?.price ?? ''} className="w-full rounded-lg border p-3" />
          <input type="hidden" name="currency" value="MXN" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="block font-medium">Descripción corta *</span>
          <textarea name="short_description" required rows={2} defaultValue={publication?.short_description ?? product.short_description ?? ''} className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="block font-medium">Descripción completa</span>
          <textarea name="description" rows={5} defaultValue={publication?.description ?? product.description ?? ''} className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2">
          <span className="block font-medium">URL de imagen pública</span>
          <input name="image_url" type="url" defaultValue={publication?.image_url ?? product.image_url ?? ''} className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2">
          <span className="block font-medium">Texto alternativo</span>
          <input name="image_alt" defaultValue={publication?.image_alt ?? product.image_alt ?? ''} className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2">
          <span className="block font-medium">Título SEO</span>
          <input name="seo_title" defaultValue={publication?.seo_title ?? product.seo_title ?? ''} className="w-full rounded-lg border p-3" />
        </label>
        <label className="space-y-2">
          <span className="block font-medium">Descripción SEO</span>
          <input name="seo_description" defaultValue={publication?.seo_description ?? product.seo_description ?? ''} className="w-full rounded-lg border p-3" />
        </label>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-3">
          <input type="checkbox" name="is_featured" defaultChecked={publication?.is_featured} />
          <span>Destacar en catálogo</span>
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="is_published" defaultChecked={publication?.is_published} />
          <span>Publicar para visitantes</span>
        </label>
      </div>

      <button type="submit" className="rounded-lg bg-[#173b2f] px-6 py-3 font-bold text-white">
        Guardar ficha pública
      </button>
    </form>
  );
}
