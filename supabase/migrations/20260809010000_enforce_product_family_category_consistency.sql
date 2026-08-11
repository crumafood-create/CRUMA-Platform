begin;

-- Products and product families must agree on category.
-- MATCH FULL also prevents a product from storing only one side of the pair.
do $$
begin
  if exists (
    select 1
    from public.products p
    left join public.product_families pf
      on pf.id = p.family_id
    where (p.family_id is null) <> (p.category_id is null)
       or (
         p.family_id is not null
         and pf.category_id is distinct from p.category_id
       )
  ) then
    raise exception 'Cannot enforce product family/category consistency: existing products contain an invalid category-family pair';
  end if;
end
$$;

alter table public.product_families
  add constraint product_families_id_category_id_key
  unique (id, category_id);

alter table public.products
  add constraint products_family_category_fkey
  foreign key (family_id, category_id)
  references public.product_families(id, category_id)
  match full;

commit;
