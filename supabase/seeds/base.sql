begin;

-- Shared synthetic catalogs for non-production environments.
-- These records are intentionally namespaced with "seed-".
insert into public.categories (
  slug,
  name,
  description,
  code_prefix,
  is_active,
  deleted_at
)
values (
  'seed-products',
  'Seed Products',
  'Synthetic category for non-production seed data.',
  'SD',
  true,
  null
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    code_prefix = excluded.code_prefix,
    is_active = true,
    deleted_at = null,
    updated_at = now();

insert into public.product_families (
  slug,
  name,
  description,
  category_id,
  is_active,
  deleted_at
)
select
  'seed-family',
  'Seed Family',
  'Synthetic product family for non-production seed data.',
  categories.id,
  true,
  null
from public.categories
where categories.slug = 'seed-products'
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    is_active = true,
    deleted_at = null,
    updated_at = now();

insert into public.flavors (
  slug,
  name,
  description,
  is_active,
  deleted_at
)
values (
  'seed-flavor',
  'Seed Flavor',
  'Synthetic global flavor for non-production seed data.',
  true,
  null
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true,
    deleted_at = null,
    updated_at = now();

insert into public.preparation_types (
  slug,
  name,
  description
)
values (
  'seed-preparation',
  'Seed Preparation',
  'Synthetic global preparation type for non-production seed data.'
)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description;

insert into public.units_of_measure (
  code,
  name,
  description,
  is_active,
  deleted_at
)
values (
  'SEED',
  'Seed Unit',
  'Synthetic unit for non-production seed data.',
  true,
  null
)
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    is_active = true,
    deleted_at = null,
    updated_at = now();

commit;
