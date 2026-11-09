-- Preserve purchase-specific packaging terms while keeping inventory quantities
-- and lot valuation in each material's base unit.
ALTER TABLE public.purchase_orders
  ADD COLUMN freight_amount numeric(14, 4) NOT NULL DEFAULT 0,
  ADD CONSTRAINT purchase_orders_freight_amount_nonnegative
    CHECK (freight_amount >= 0);

ALTER TABLE public.purchase_order_items
  ADD COLUMN presentation_mode text,
  ADD COLUMN purchase_quantity numeric(14, 4),
  ADD COLUMN base_quantity_per_presentation numeric(14, 4),
  ADD COLUMN purchase_unit_price numeric(14, 4);

-- Existing rows remain purchases in base units. Their quantity, unit cost,
-- received quantity and historical total are left untouched.
UPDATE public.purchase_order_items
SET presentation_mode = 'base_unit',
    purchase_quantity = quantity,
    base_quantity_per_presentation = 1,
    purchase_unit_price = unit_cost;

ALTER TABLE public.purchase_order_items
  ALTER COLUMN presentation_mode SET NOT NULL,
  ALTER COLUMN purchase_quantity SET NOT NULL,
  ALTER COLUMN base_quantity_per_presentation SET NOT NULL,
  ALTER COLUMN purchase_unit_price SET NOT NULL,
  ADD CONSTRAINT purchase_order_items_presentation_mode_check
    CHECK (presentation_mode IN ('base_unit', 'sealed_package')),
  ADD CONSTRAINT purchase_order_items_purchase_quantity_positive
    CHECK (purchase_quantity > 0),
  ADD CONSTRAINT purchase_order_items_presentation_content_positive
    CHECK (base_quantity_per_presentation > 0),
  ADD CONSTRAINT purchase_order_items_purchase_unit_price_nonnegative
    CHECK (purchase_unit_price >= 0),
  ADD CONSTRAINT purchase_order_items_base_unit_presentation_check
    CHECK (
      presentation_mode <> 'base_unit'
      OR (
        purchase_quantity = quantity
        AND base_quantity_per_presentation = 1
        AND purchase_unit_price = unit_cost
      )
    ),
  ADD CONSTRAINT purchase_order_items_sealed_package_presentation_check
    CHECK (
      presentation_mode <> 'sealed_package'
      OR (
        purchase_quantity = trunc(purchase_quantity)
        AND quantity = round(purchase_quantity * base_quantity_per_presentation, 4)
        AND unit_cost = round(purchase_unit_price / base_quantity_per_presentation, 4)
        AND total = round(purchase_quantity * purchase_unit_price, 4)
      )
    );

CREATE OR REPLACE FUNCTION public.set_purchase_order_presentation_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.presentation_mode := coalesce(NEW.presentation_mode, 'base_unit');
  NEW.purchase_quantity := coalesce(NEW.purchase_quantity, NEW.quantity);
  NEW.base_quantity_per_presentation :=
    coalesce(NEW.base_quantity_per_presentation, 1);
  NEW.purchase_unit_price := coalesce(NEW.purchase_unit_price, NEW.unit_cost);
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_purchase_order_presentation_defaults()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER purchase_order_items_set_presentation_defaults
BEFORE INSERT ON public.purchase_order_items
FOR EACH ROW EXECUTE FUNCTION public.set_purchase_order_presentation_defaults();

CREATE OR REPLACE FUNCTION public.calculate_purchase_order_line(
  p_presentation_mode text,
  p_purchase_quantity numeric,
  p_base_quantity_per_presentation numeric,
  p_purchase_unit_price numeric
)
RETURNS TABLE (
  base_quantity numeric,
  base_unit_cost numeric,
  product_total numeric
)
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF p_presentation_mode IS NULL
    OR p_presentation_mode NOT IN ('base_unit', 'sealed_package')
    OR p_purchase_quantity IS NULL
    OR p_purchase_quantity::text IN ('NaN', 'Infinity', '-Infinity')
    OR p_purchase_quantity <= 0
    OR p_purchase_quantity <> round(p_purchase_quantity, 4)
    OR p_base_quantity_per_presentation IS NULL
    OR p_base_quantity_per_presentation::text IN ('NaN', 'Infinity', '-Infinity')
    OR p_base_quantity_per_presentation <= 0
    OR p_base_quantity_per_presentation <> round(p_base_quantity_per_presentation, 4)
    OR p_purchase_unit_price IS NULL
    OR p_purchase_unit_price::text IN ('NaN', 'Infinity', '-Infinity')
    OR p_purchase_unit_price < 0
    OR p_purchase_unit_price <> round(p_purchase_unit_price, 4) THEN
    RAISE EXCEPTION 'Purchase presentation values are invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF p_presentation_mode = 'base_unit' THEN
    IF p_base_quantity_per_presentation <> 1 THEN
      RAISE EXCEPTION 'A base-unit purchase must use a conversion of one.'
        USING ERRCODE = '22023';
    END IF;
    base_quantity := p_purchase_quantity;
    base_unit_cost := p_purchase_unit_price;
  ELSE
    IF p_purchase_quantity <> trunc(p_purchase_quantity) THEN
      RAISE EXCEPTION 'Sealed package quantity must be a whole number.'
        USING ERRCODE = '22023';
    END IF;
    base_quantity := round(
      p_purchase_quantity * p_base_quantity_per_presentation,
      4
    );
    base_unit_cost := round(
      p_purchase_unit_price / p_base_quantity_per_presentation,
      4
    );
  END IF;

  IF base_quantity <= 0 THEN
    RAISE EXCEPTION 'Converted base quantity is below the supported precision.'
      USING ERRCODE = '22023';
  END IF;

  -- Keep the commercial amount authoritative. Do not derive it from the
  -- rounded base-unit cost.
  product_total := round(p_purchase_quantity * p_purchase_unit_price, 4);
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_purchase_order_line(text, numeric, numeric, numeric)
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.sync_purchase_order_totals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_order_id uuid;
BEGIN
  target_order_id := CASE WHEN TG_OP = 'DELETE'
    THEN OLD.purchase_order_id ELSE NEW.purchase_order_id END;

  UPDATE public.purchase_orders AS purchase_order
  SET subtotal = coalesce((
        SELECT sum(item.total)
        FROM public.purchase_order_items AS item
        WHERE item.purchase_order_id = target_order_id
      ), 0),
      total = coalesce((
        SELECT sum(item.total)
        FROM public.purchase_order_items AS item
        WHERE item.purchase_order_id = target_order_id
      ), 0) + purchase_order.freight_amount,
      updated_at = now()
  WHERE purchase_order.id = target_order_id;

  IF TG_OP = 'UPDATE' AND OLD.purchase_order_id IS DISTINCT FROM NEW.purchase_order_id THEN
    UPDATE public.purchase_orders AS purchase_order
    SET subtotal = coalesce((
          SELECT sum(item.total)
          FROM public.purchase_order_items AS item
          WHERE item.purchase_order_id = OLD.purchase_order_id
        ), 0),
        total = coalesce((
          SELECT sum(item.total)
          FROM public.purchase_order_items AS item
          WHERE item.purchase_order_id = OLD.purchase_order_id
        ), 0) + purchase_order.freight_amount,
        updated_at = now()
    WHERE purchase_order.id = OLD.purchase_order_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_purchase_order_totals()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER purchase_order_items_sync_totals
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_order_items
FOR EACH ROW EXECUTE FUNCTION public.sync_purchase_order_totals();

CREATE OR REPLACE FUNCTION public.sync_purchase_order_amounts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  calculated_subtotal numeric;
BEGIN
  IF TG_OP = 'UPDATE'
    AND NEW.freight_amount IS DISTINCT FROM OLD.freight_amount
    AND (OLD.status <> 'draft' OR NEW.status <> 'draft') THEN
    RAISE EXCEPTION 'Freight can only change while the purchase order is a draft.'
      USING ERRCODE = '23514';
  END IF;

  SELECT coalesce(sum(item.total), 0)
  INTO calculated_subtotal
  FROM public.purchase_order_items AS item
  WHERE item.purchase_order_id = NEW.id;

  NEW.subtotal := calculated_subtotal;
  NEW.total := calculated_subtotal + NEW.freight_amount;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sync_purchase_order_amounts()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER purchase_orders_sync_amounts
BEFORE INSERT OR UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.sync_purchase_order_amounts();

CREATE OR REPLACE FUNCTION public.guard_purchase_order_package_receipt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  accepted_delta numeric;
BEGIN
  IF NEW.received_quantity IS NOT DISTINCT FROM OLD.received_quantity THEN
    RETURN NEW;
  END IF;
  IF NEW.received_quantity < OLD.received_quantity THEN
    RAISE EXCEPTION 'Received quantity cannot be reduced.' USING ERRCODE = '23514';
  END IF;

  accepted_delta := NEW.received_quantity - OLD.received_quantity;
  IF OLD.presentation_mode = 'sealed_package'
    AND accepted_delta / OLD.base_quantity_per_presentation
      <> trunc(accepted_delta / OLD.base_quantity_per_presentation) THEN
    RAISE EXCEPTION 'Only complete sealed packages can be accepted.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.guard_purchase_order_package_receipt()
  FROM PUBLIC, anon, authenticated, service_role;

CREATE TRIGGER purchase_order_items_guard_package_receipt
BEFORE UPDATE OF received_quantity ON public.purchase_order_items
FOR EACH ROW EXECUTE FUNCTION public.guard_purchase_order_package_receipt();

CREATE OR REPLACE FUNCTION public.add_purchase_order_item_with_presentation(
  p_order_id uuid,
  p_raw_material_id uuid,
  p_presentation_mode text,
  p_purchase_quantity numeric,
  p_base_quantity_per_presentation numeric,
  p_purchase_unit_price numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item_id uuid;
  order_status text;
  line record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase order management requires an administrator.';
  END IF;

  SELECT status INTO order_status
  FROM public.purchase_orders
  WHERE id = p_order_id AND deleted_at IS NULL
  FOR UPDATE;
  IF order_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Purchase order is not an editable draft.' USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.raw_materials AS material
    JOIN public.units_of_measure AS unit
      ON unit.id = material.unit_of_measure_id
    WHERE material.id = p_raw_material_id
      AND material.is_active = true
      AND material.deleted_at IS NULL
      AND unit.is_active = true
      AND unit.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Raw material or its base unit is not available.' USING ERRCODE = '23514';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.purchase_order_items
    WHERE purchase_order_id = p_order_id AND raw_material_id = p_raw_material_id
  ) THEN
    RAISE EXCEPTION 'Raw material is already included.' USING ERRCODE = '23505';
  END IF;

  SELECT * INTO line
  FROM public.calculate_purchase_order_line(
    p_presentation_mode,
    p_purchase_quantity,
    p_base_quantity_per_presentation,
    p_purchase_unit_price
  );

  INSERT INTO public.purchase_order_items (
    purchase_order_id,
    raw_material_id,
    quantity,
    unit_cost,
    total,
    received_quantity,
    presentation_mode,
    purchase_quantity,
    base_quantity_per_presentation,
    purchase_unit_price
  ) VALUES (
    p_order_id,
    p_raw_material_id,
    line.base_quantity,
    line.base_unit_cost,
    line.product_total,
    0,
    p_presentation_mode,
    p_purchase_quantity,
    p_base_quantity_per_presentation,
    p_purchase_unit_price
  ) RETURNING id INTO item_id;

  RETURN item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.add_purchase_order_item_with_presentation(
  uuid, uuid, text, numeric, numeric, numeric
) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.add_purchase_order_item_with_presentation(
  uuid, uuid, text, numeric, numeric, numeric
) TO authenticated;

-- Keep callers that still create direct base-unit items on the same rules.
CREATE OR REPLACE FUNCTION public.add_purchase_order_item(
  p_order_id uuid,
  p_raw_material_id uuid,
  p_quantity numeric,
  p_unit_cost numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN public.add_purchase_order_item_with_presentation(
    p_order_id,
    p_raw_material_id,
    'base_unit',
    p_quantity,
    1,
    p_unit_cost
  );
END;
$$;

REVOKE ALL ON FUNCTION public.add_purchase_order_item(uuid, uuid, numeric, numeric)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.add_purchase_order_item(uuid, uuid, numeric, numeric)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.update_purchase_order_item_presentation(
  p_item_id uuid,
  p_presentation_mode text,
  p_purchase_quantity numeric,
  p_base_quantity_per_presentation numeric,
  p_purchase_unit_price numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  order_id uuid;
  order_status text;
  item public.purchase_order_items%ROWTYPE;
  line record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase order management requires an administrator.';
  END IF;

  SELECT purchase_order_id INTO order_id
  FROM public.purchase_order_items WHERE id = p_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order item not found.' USING ERRCODE = 'P0002'; END IF;

  SELECT status INTO order_status
  FROM public.purchase_orders WHERE id = order_id AND deleted_at IS NULL FOR UPDATE;
  IF order_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Purchase order is not an editable draft.' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO item FROM public.purchase_order_items WHERE id = p_item_id FOR UPDATE;
  IF NOT FOUND OR item.purchase_order_id <> order_id THEN
    RAISE EXCEPTION 'Purchase order item changed while being edited.' USING ERRCODE = '40001';
  END IF;

  SELECT * INTO line
  FROM public.calculate_purchase_order_line(
    p_presentation_mode,
    p_purchase_quantity,
    p_base_quantity_per_presentation,
    p_purchase_unit_price
  );

  UPDATE public.purchase_order_items
  SET quantity = line.base_quantity,
      unit_cost = line.base_unit_cost,
      total = line.product_total,
      presentation_mode = p_presentation_mode,
      purchase_quantity = p_purchase_quantity,
      base_quantity_per_presentation = p_base_quantity_per_presentation,
      purchase_unit_price = p_purchase_unit_price
  WHERE id = p_item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_purchase_order_item_presentation(
  uuid, text, numeric, numeric, numeric
) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_purchase_order_item_presentation(
  uuid, text, numeric, numeric, numeric
) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_purchase_order_item(p_item_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  order_id uuid;
  order_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase order management requires an administrator.';
  END IF;
  SELECT purchase_order_id INTO order_id
  FROM public.purchase_order_items WHERE id = p_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase order item not found.' USING ERRCODE = 'P0002'; END IF;

  SELECT status INTO order_status
  FROM public.purchase_orders WHERE id = order_id AND deleted_at IS NULL FOR UPDATE;
  IF order_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Purchase order is not an editable draft.' USING ERRCODE = '23514';
  END IF;

  DELETE FROM public.purchase_order_items WHERE id = p_item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_purchase_order_item(uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.delete_purchase_order_item(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.update_purchase_order_freight(
  p_order_id uuid,
  p_freight_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  order_status text;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase order management requires an administrator.';
  END IF;
  IF p_freight_amount IS NULL
    OR p_freight_amount::text IN ('NaN', 'Infinity', '-Infinity')
    OR p_freight_amount < 0
    OR p_freight_amount <> round(p_freight_amount, 4) THEN
    RAISE EXCEPTION 'Freight amount is invalid.' USING ERRCODE = '22023';
  END IF;

  SELECT status INTO order_status
  FROM public.purchase_orders
  WHERE id = p_order_id AND deleted_at IS NULL
  FOR UPDATE;
  IF order_status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Purchase order is not an editable draft.' USING ERRCODE = '23514';
  END IF;

  UPDATE public.purchase_orders
  SET freight_amount = p_freight_amount, updated_at = now()
  WHERE id = p_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.update_purchase_order_freight(uuid, numeric)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.update_purchase_order_freight(uuid, numeric)
  TO authenticated;

-- Item changes must go through the atomic functions above; receiving and
-- requisition conversion continue through their existing SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS purchase_order_items_admin_write ON public.purchase_order_items;
