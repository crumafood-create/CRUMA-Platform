import Link from 'next/link';
import { notFound } from 'next/navigation';

import { createTypedClient } from '@/infrastructure/integrations/supabase/server';
import { RecipeForm } from '@/modules/manufacturing/components/forms/recipe-form';

import { updateRecipe } from '../../actions';

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createTypedClient();
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('id, product_id, name, description, yield_quantity, unit_of_measure_id, is_active')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error('No se pudo cargar la receta.');
  if (!recipe) notFound();
  if (!recipe.product_id || !recipe.unit_of_measure_id) {
    throw new Error('La receta debe tener producto de salida y unidad para editarse.');
  }

  const [{ data: product }, { data: unit }] = await Promise.all([
    supabase.from('products').select('id, name').eq('id', recipe.product_id).maybeSingle(),
    supabase.from('units_of_measure').select('id, name, code').eq('id', recipe.unit_of_measure_id).maybeSingle(),
  ]);

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">Editar receta</h1>
        <Link href={`/recipes/${id}`} className="rounded border px-4 py-2">Volver</Link>
      </header>
      <RecipeForm
        action={updateRecipe}
        products={[]}
        unitsOfMeasure={[]}
        recipeId={id}
        outputProductLabel={product?.name ?? 'Producto no disponible'}
        outputUnitLabel={unit ? `${unit.code} - ${unit.name}` : 'Unidad no disponible'}
        initialValues={recipe}
      />
    </main>
  );
}
