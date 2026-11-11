ALTER TABLE public.recipe_items
  ADD COLUMN product_id uuid,
  ALTER COLUMN raw_material_id DROP NOT NULL;

ALTER TABLE public.recipe_items
  ADD CONSTRAINT recipe_items_product_id_fkey
    FOREIGN KEY (product_id)
    REFERENCES public.products(id),
  ADD CONSTRAINT recipe_items_exactly_one_ingredient
    CHECK (
      (raw_material_id IS NOT NULL AND product_id IS NULL)
      OR (raw_material_id IS NULL AND product_id IS NOT NULL)
    );

CREATE INDEX idx_recipe_items_product
  ON public.recipe_items(product_id)
  WHERE product_id IS NOT NULL;

CREATE UNIQUE INDEX recipe_items_one_product_ingredient_per_recipe
  ON public.recipe_items(recipe_id)
  WHERE product_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.guard_recipe_item_output_product()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  output_product_id uuid;
BEGIN
  IF NEW.product_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT recipe.product_id
  INTO output_product_id
  FROM public.recipes AS recipe
  WHERE recipe.id = NEW.recipe_id;

  IF output_product_id IS NOT DISTINCT FROM NEW.product_id THEN
    RAISE EXCEPTION
      'A recipe cannot use its own output product as an ingredient.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER recipe_item_output_product_guard
BEFORE INSERT OR UPDATE
ON public.recipe_items
FOR EACH ROW
EXECUTE FUNCTION public.guard_recipe_item_output_product();

REVOKE ALL ON FUNCTION public.guard_recipe_item_output_product()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_production_order_recipe_ingredients()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.recipe_items AS recipe_item
    WHERE recipe_item.recipe_id = NEW.recipe_id
      AND recipe_item.product_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Las órdenes de producción todavía no admiten productos intermedios como ingredientes.'
      USING ERRCODE = '0A000';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER production_order_recipe_ingredients_guard
BEFORE INSERT OR UPDATE
ON public.production_orders
FOR EACH ROW
EXECUTE FUNCTION public.guard_production_order_recipe_ingredients();

REVOKE ALL ON FUNCTION public.guard_production_order_recipe_ingredients()
  FROM PUBLIC, anon, authenticated, service_role;
