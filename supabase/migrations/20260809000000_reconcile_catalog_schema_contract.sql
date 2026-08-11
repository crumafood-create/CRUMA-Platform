begin;

-- Product families are the classification referenced by products.family_id.
-- Existing families are a separate catalog used by raw materials.
alter table public.product_families
  add column if not exists category_id uuid,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

-- A product family can be backfilled only when all products using it
-- belong to exactly one non-null category.
do $$
begin
  if exists (
    select 1
    from public.product_families pf
    join public.products p on p.family_id = pf.id
    group by pf.id
    having count(*) filter (where p.category_id is null) > 0
       or count(distinct p.category_id) > 1
  ) then
    raise exception 'Cannot reconcile product_families: a family is used by products from multiple or null categories';
  end if;
end
$$;

update public.product_families pf
set category_id = source.category_id,
    updated_at = now()
from (
  select p.family_id, p.category_id
  from public.products p
  where p.family_id is not null
    and p.category_id is not null
  group by p.family_id, p.category_id
) as source
where pf.id = source.family_id
  and pf.category_id is null;

-- Do not silently invent a category for an unused or otherwise
-- unclassifiable existing product family.
do $$
begin
  if exists (
    select 1
    from public.product_families
    where category_id is null
  ) then
    raise exception 'Cannot reconcile product_families: at least one family has no derivable category';
  end if;
end
$$;

alter table public.product_families
  alter column category_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'product_families_category_id_fkey'
      and conrelid = 'public.product_families'::regclass
  ) then
    alter table public.product_families
      add constraint product_families_category_id_fkey
      foreign key (category_id)
      references public.categories(id);
  end if;
end
$$;

-- Flavors are global product attributes, not children of a single family.
alter table public.flavors
  add column if not exists is_active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists deleted_at timestamptz;

-- Units already expose description and soft-delete behavior in the app.
alter table public.units_of_measure
  add column if not exists description text,
  add column if not exists deleted_at timestamptz;

commit;
