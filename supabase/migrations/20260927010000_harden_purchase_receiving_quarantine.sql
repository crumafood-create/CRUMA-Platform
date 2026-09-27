-- Register partial purchase receipts as quarantined physical stock.
-- Quarantined material is not available to MRP or Production.

UPDATE public.raw_material_lots
SET status = 'available',
    updated_at = now()
WHERE status = 'active';

ALTER TABLE public.raw_material_lots
  ALTER COLUMN status SET DEFAULT 'quarantine';

ALTER TABLE public.raw_material_lots
  DROP CONSTRAINT IF EXISTS raw_material_lots_status_check;

ALTER TABLE public.raw_material_lots
  ADD CONSTRAINT raw_material_lots_status_check
  CHECK (
    status IN (
      'quarantine',
      'available',
      'hold',
      'rejected',
      'depleted'
    )
  ) NOT VALID;

  CREATE OR REPLACE FUNCTION
  public.guard_raw_material_lot_quantity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.status <> 'available'
     AND NEW.quantity IS DISTINCT FROM
       OLD.quantity THEN
    RAISE EXCEPTION
      'Quarantined raw material lot quantity cannot be changed.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL
  ON FUNCTION
    public.guard_raw_material_lot_quantity()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS
  raw_material_lot_quantity_guard
  ON public.raw_material_lots;

CREATE TRIGGER
  raw_material_lot_quantity_guard
BEFORE UPDATE OF quantity
  ON public.raw_material_lots
FOR EACH ROW
EXECUTE FUNCTION
  public.guard_raw_material_lot_quantity();

CREATE TABLE public.purchase_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL
    REFERENCES public.purchase_orders(id)
    ON DELETE RESTRICT,
  idempotency_key uuid NOT NULL UNIQUE,
  received_by uuid NOT NULL
    REFERENCES public.profiles(id)
    ON DELETE RESTRICT,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.purchase_receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_receipt_id uuid NOT NULL
    REFERENCES public.purchase_receipts(id)
    ON DELETE CASCADE,
  purchase_order_item_id uuid NOT NULL
    REFERENCES public.purchase_order_items(id)
    ON DELETE RESTRICT,
  raw_material_lot_id uuid NOT NULL
    REFERENCES public.raw_material_lots(id)
    ON DELETE RESTRICT,
  inventory_location_id uuid NOT NULL
    REFERENCES public.inventory_locations(id)
    ON DELETE RESTRICT,
  quantity numeric(18,4) NOT NULL
    CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (
    purchase_receipt_id,
    purchase_order_item_id,
    raw_material_lot_id
  )
);

CREATE INDEX purchase_receipts_order_idx
  ON public.purchase_receipts(
    purchase_order_id,
    received_at DESC
  );

CREATE INDEX purchase_receipt_items_order_item_idx
  ON public.purchase_receipt_items(
    purchase_order_item_id,
    created_at
  );

CREATE INDEX purchase_receipt_items_lot_idx
  ON public.purchase_receipt_items(
    raw_material_lot_id
  );

ALTER TABLE public.purchase_receipts
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.purchase_receipt_items
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_receipts_admin_read
  ON public.purchase_receipts
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY purchase_receipt_items_admin_read
  ON public.purchase_receipt_items
  FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

REVOKE ALL
  ON TABLE public.purchase_receipts
  FROM PUBLIC, anon, authenticated;

REVOKE ALL
  ON TABLE public.purchase_receipt_items
  FROM PUBLIC, anon, authenticated;

GRANT SELECT
  ON TABLE public.purchase_receipts
  TO authenticated;

GRANT SELECT
  ON TABLE public.purchase_receipt_items
  TO authenticated;

GRANT ALL
  ON TABLE public.purchase_receipts
  TO service_role;

GRANT ALL
  ON TABLE public.purchase_receipt_items
  TO service_role;

-- Disable legacy receiving operations that make stock available
-- without a lot and without a quality quarantine.
REVOKE EXECUTE
  ON FUNCTION public.receive_purchase_order_item(
    uuid,
    numeric
  )
  FROM authenticated;

REVOKE EXECUTE
  ON FUNCTION public.receive_purchase_order(uuid)
  FROM authenticated;

DROP FUNCTION IF EXISTS
  public.receive_purchase_order_lot(
    uuid,
    text,
    date,
    uuid
  );

CREATE OR REPLACE FUNCTION public.receive_purchase_order_lot(
  p_item_id uuid,
  p_quantity numeric,
  p_lot_number text,
  p_expiration_date date,
  p_inventory_location_id uuid,
  p_idempotency_key uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item public.purchase_order_items%ROWTYPE;
  order_status text;
  pending numeric;
  completed boolean;
  normalized_lot_number text;
  receipt_id uuid;
  raw_material_lot_id uuid;
  existing_order_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege
      USING MESSAGE =
        'Purchase order receiving requires an administrator.';
  END IF;

  IF p_item_id IS NULL
     OR p_quantity IS NULL
     OR p_quantity <= 0
     OR p_inventory_location_id IS NULL
     OR p_idempotency_key IS NULL THEN
    RAISE EXCEPTION
      'Receipt data is incomplete or invalid.'
      USING ERRCODE = '22023';
  END IF;

  normalized_lot_number :=
    upper(btrim(p_lot_number));

  IF normalized_lot_number IS NULL
     OR normalized_lot_number = ''
     OR normalized_lot_number
       !~ '^[A-Z0-9][A-Z0-9._/-]{0,79}$' THEN
    RAISE EXCEPTION
      'Lot number is invalid.'
      USING ERRCODE = '22023';
  END IF;

  IF p_expiration_date IS NULL
     OR p_expiration_date < CURRENT_DATE THEN
    RAISE EXCEPTION
      'Expiration date cannot be in the past.'
      USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      p_idempotency_key::text,
      0
    )
  );

  SELECT receipt.purchase_order_id
  INTO existing_order_id
  FROM public.purchase_receipts AS receipt
  JOIN public.purchase_receipt_items AS receipt_item
    ON receipt_item.purchase_receipt_id = receipt.id
  JOIN public.raw_material_lots AS lot
    ON lot.id = receipt_item.raw_material_lot_id
  WHERE receipt.idempotency_key =
      p_idempotency_key
    AND receipt_item.purchase_order_item_id =
      p_item_id
    AND receipt_item.quantity =
      p_quantity
    AND receipt_item.inventory_location_id =
      p_inventory_location_id
    AND upper(lot.lot_number) =
      normalized_lot_number
    AND lot.expiration_date IS NOT DISTINCT FROM
      p_expiration_date
  LIMIT 1;

  IF existing_order_id IS NOT NULL THEN
    RETURN existing_order_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.purchase_receipts
    WHERE idempotency_key =
      p_idempotency_key
  ) THEN
    RAISE EXCEPTION
      'Idempotency key was reused with different receipt data.'
      USING ERRCODE = '23505';
  END IF;

  SELECT *
  INTO item
  FROM public.purchase_order_items
  WHERE id = p_item_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'Purchase order item not found.'
      USING ERRCODE = 'P0002';
  END IF;

  SELECT status
  INTO order_status
  FROM public.purchase_orders
  WHERE id = item.purchase_order_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF order_status IS NULL
     OR order_status NOT IN (
       'released',
       'partially_received'
     ) THEN
    RAISE EXCEPTION
      'Purchase order cannot be received in its current state.'
      USING ERRCODE = '23514';
  END IF;

  pending :=
    item.quantity -
    item.received_quantity;

  IF pending <= 0
     OR p_quantity > pending THEN
    RAISE EXCEPTION
      'Receipt quantity exceeds the pending quantity.'
      USING ERRCODE = '23514';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.inventory_locations
    WHERE id = p_inventory_location_id
      AND is_active = true
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'Inventory location is not available.'
      USING ERRCODE = '23514';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(
      item.raw_material_id::text ||
      ':' ||
      normalized_lot_number,
      0
    )
  );

  IF EXISTS (
    SELECT 1
    FROM public.raw_material_lots
    WHERE raw_material_id =
      item.raw_material_id
      AND upper(lot_number) =
        normalized_lot_number
  ) THEN
    RAISE EXCEPTION
      'Lot number already exists for this raw material.'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.purchase_receipts (
    purchase_order_id,
    idempotency_key,
    received_by
  )
  VALUES (
    item.purchase_order_id,
    p_idempotency_key,
    auth.uid()
  )
  RETURNING id
  INTO receipt_id;

  INSERT INTO public.raw_material_lots (
    raw_material_id,
    lot_number,
    supplier_lot,
    expiration_date,
    quantity,
    inventory_location_id,
    status,
    unit_cost
  )
  VALUES (
    item.raw_material_id,
    normalized_lot_number,
    normalized_lot_number,
    p_expiration_date,
    p_quantity,
    p_inventory_location_id,
    'quarantine',
    item.unit_cost
  )
  RETURNING id
  INTO raw_material_lot_id;

  INSERT INTO public.purchase_receipt_items (
    purchase_receipt_id,
    purchase_order_item_id,
    raw_material_lot_id,
    inventory_location_id,
    quantity
  )
  VALUES (
    receipt_id,
    item.id,
    raw_material_lot_id,
    p_inventory_location_id,
    p_quantity
  );

  UPDATE public.purchase_order_items
  SET received_quantity =
    received_quantity + p_quantity
  WHERE id = item.id;

  SELECT bool_and(
    received_quantity >= quantity
  )
  INTO completed
  FROM public.purchase_order_items
  WHERE purchase_order_id =
    item.purchase_order_id;

  UPDATE public.purchase_orders
  SET status = CASE
      WHEN completed
        THEN 'received'
      ELSE 'partially_received'
    END,
    updated_at = now()
  WHERE id = item.purchase_order_id;

  RETURN item.purchase_order_id;
END;
$$;

REVOKE ALL
  ON FUNCTION public.receive_purchase_order_lot(
    uuid,
    numeric,
    text,
    date,
    uuid,
    uuid
  )
  FROM PUBLIC, anon, service_role;

GRANT EXECUTE
  ON FUNCTION public.receive_purchase_order_lot(
    uuid,
    numeric,
    text,
    date,
    uuid,
    uuid
  )
  TO authenticated;