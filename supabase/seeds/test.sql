begin;

with seed_refs as (
  select
    categories.id as category_id,
    product_families.id as family_id,
    flavors.id as flavor_id,
    preparation_types.id as preparation_type_id,
    units_of_measure.id as unit_of_measure_id
  from public.categories
  join public.product_families
    on product_families.category_id = categories.id
   and product_families.slug = 'seed-family'
  cross join public.flavors
  cross join public.preparation_types
  cross join public.units_of_measure
  where categories.slug = 'seed-products'
    and flavors.slug = 'seed-flavor'
    and preparation_types.slug = 'seed-preparation'
    and units_of_measure.code = 'SEED'
)
insert into public.products (
  category_id,
  family_id,
  flavor_id,
  preparation_type_id,
  unit_of_measure_id,
  slug,
  name,
  short_description,
  status,
  is_active,
  deleted_at
)
select
  category_id,
  family_id,
  flavor_id,
  preparation_type_id,
  unit_of_measure_id,
  'seed-test-product',
  'Test Seed Product',
  'Synthetic product for automated tests.',
  'draft',
  true,
  null
from seed_refs
on conflict (slug) do update
set category_id = excluded.category_id,
    family_id = excluded.family_id,
    flavor_id = excluded.flavor_id,
    preparation_type_id = excluded.preparation_type_id,
    unit_of_measure_id = excluded.unit_of_measure_id,
    name = excluded.name,
    short_description = excluded.short_description,
    status = excluded.status,
    is_active = excluded.is_active,
    deleted_at = null,
    updated_at = now();

commit;
