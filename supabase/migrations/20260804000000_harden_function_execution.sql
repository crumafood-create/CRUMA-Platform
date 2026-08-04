-- Harden the function surface captured by SEC-DB-005 and SEC-DB-006.
-- This migration intentionally preserves SECURITY INVOKER for application RPCs.
-- RLS and transactional redesign remain separate remediations.

CREATE OR REPLACE FUNCTION public.create_production_order_items(
  p_production_order_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_recipe_id uuid;
  v_quantity numeric;
BEGIN
  SELECT
    production_order.recipe_id,
    production_order.planned_quantity
  INTO
    v_recipe_id,
    v_quantity
  FROM public.production_orders AS production_order
  WHERE production_order.id = p_production_order_id;

  IF v_recipe_id IS NULL THEN
    RAISE EXCEPTION 'La orden no tiene receta';
  END IF;

  INSERT INTO public.production_order_items (
    production_order_id,
    raw_material_id,
    planned_quantity,
    consumed_quantity,
    status
  )
  SELECT
    p_production_order_id,
    recipe_item.raw_material_id,
    recipe_item.quantity * v_quantity,
    0,
    'pending'
  FROM public.recipe_items AS recipe_item
  WHERE recipe_item.recipe_id = v_recipe_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrease_product_lot_quantity(
  p_lot_id uuid,
  p_quantity numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.product_lots AS product_lot
  SET
    quantity = greatest(product_lot.quantity - p_quantity, 0),
    updated_at = now()
  WHERE product_lot.id = p_lot_id;
END;
$function$;

ALTER FUNCTION public.handle_new_user()
  SET search_path = '';

ALTER FUNCTION public.is_admin(uuid)
  SET search_path = '';

REVOKE ALL ON FUNCTION public.create_production_order_items(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.decrease_product_lot_quantity(uuid, numeric)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.generate_invoice_number()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.generate_purchase_requisition_number()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_admin(uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.log_order_status_change()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.recalculate_cart_totals()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_updated_at()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.sync_order_payment_status()
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.update_order_timestamp()
  FROM PUBLIC, anon, authenticated, service_role;

-- These are the only functions currently required by authenticated requests.
-- The RPCs remain subject to their underlying RLS policies.
GRANT EXECUTE ON FUNCTION public.create_production_order_items(uuid)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrease_product_lot_quantity(uuid, numeric)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid)
  TO authenticated;
