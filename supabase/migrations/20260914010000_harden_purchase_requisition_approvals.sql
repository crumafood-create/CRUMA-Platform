-- Make purchase requisitions, decisions, and supplier conversion atomic and auditable.
ALTER TABLE public.purchase_orders
  ADD COLUMN purchase_requisition_id uuid
  REFERENCES public.purchase_requisitions(id) ON DELETE SET NULL;

ALTER TABLE public.purchase_requisitions
  ADD CONSTRAINT purchase_requisitions_status_check CHECK (
    status IN ('draft', 'pending_approval', 'approved', 'rejected', 'converted', 'cancelled')
  ) NOT VALID;
ALTER TABLE public.purchase_requisition_items
  ADD CONSTRAINT purchase_requisition_items_quantity_check CHECK (
    required_quantity >= 0 AND available_quantity >= 0 AND purchase_quantity > 0
  ) NOT VALID;
ALTER TABLE public.approvals
  ADD CONSTRAINT approvals_status_check CHECK (
    status IN ('pending', 'approved', 'rejected')
  ) NOT VALID;

CREATE UNIQUE INDEX approvals_pending_reference_key
  ON public.approvals(approval_type, reference_type, reference_id)
  WHERE status = 'pending' AND approval_type = 'purchase_requisition';
CREATE UNIQUE INDEX purchase_orders_requisition_supplier_key
  ON public.purchase_orders(purchase_requisition_id, supplier_id)
  WHERE purchase_requisition_id IS NOT NULL;

ALTER TABLE public.purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purchase_requisitions_admin_read ON public.purchase_requisitions;
DROP POLICY IF EXISTS purchase_requisitions_admin_write ON public.purchase_requisitions;
DROP POLICY IF EXISTS purchase_requisition_items_admin_read ON public.purchase_requisition_items;
DROP POLICY IF EXISTS purchase_requisition_items_admin_write ON public.purchase_requisition_items;
DROP POLICY IF EXISTS approvals_admin_read ON public.approvals;
DROP POLICY IF EXISTS approvals_admin_write ON public.approvals;

CREATE POLICY purchase_requisitions_admin_read ON public.purchase_requisitions
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY purchase_requisitions_admin_write ON public.purchase_requisitions
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY purchase_requisition_items_admin_read ON public.purchase_requisition_items
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY purchase_requisition_items_admin_write ON public.purchase_requisition_items
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY approvals_admin_read ON public.approvals
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY approvals_admin_write ON public.approvals
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.create_purchase_requisition_from_mrp()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  requisition_id uuid;
  item_count integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase requisition management requires an administrator.';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('purchase_requisition_from_mrp', 0));
  IF EXISTS (
    SELECT 1 FROM public.purchase_requisitions
    WHERE status IN ('draft', 'pending_approval', 'approved')
  ) THEN RAISE EXCEPTION 'An open purchase requisition already exists.'; END IF;

  INSERT INTO public.purchase_requisitions(requisition_number, status, requested_by)
  VALUES (public.generate_purchase_requisition_number(), 'draft', auth.uid())
  RETURNING id INTO requisition_id;

  INSERT INTO public.purchase_requisition_items(
    purchase_requisition_id, raw_material_id, required_quantity,
    available_quantity, purchase_quantity
  )
  SELECT requisition_id, mrp.raw_material_id, mrp.required_quantity,
    coalesce(stock.quantity, 0),
    greatest(mrp.required_quantity - coalesce(stock.quantity, 0), 0)
  FROM public.mrp_requirements mrp
  JOIN public.raw_materials material
    ON material.id = mrp.raw_material_id
    AND material.is_active = true AND material.deleted_at IS NULL
  LEFT JOIN (
    SELECT item_id, sum(quantity) AS quantity
    FROM public.inventory_stock_by_item
    WHERE item_type = 'raw_material'
    GROUP BY item_id
  ) stock ON stock.item_id = mrp.raw_material_id
  WHERE greatest(mrp.required_quantity - coalesce(stock.quantity, 0), 0) > 0;
  GET DIAGNOSTICS item_count = ROW_COUNT;
  IF item_count = 0 THEN RAISE EXCEPTION 'No purchase shortages were found.'; END IF;
  RETURN requisition_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_purchase_requisition(p_requisition_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  requisition public.purchase_requisitions%ROWTYPE;
  approval_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase requisition management requires an administrator.';
  END IF;
  SELECT * INTO requisition FROM public.purchase_requisitions
  WHERE id = p_requisition_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase requisition not found.'; END IF;
  IF requisition.status IS DISTINCT FROM 'draft' THEN
    RAISE EXCEPTION 'Purchase requisition is not a draft.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_requisition_items
    WHERE purchase_requisition_id = requisition.id AND purchase_quantity > 0
  ) THEN RAISE EXCEPTION 'Purchase requisition has no items.'; END IF;

  INSERT INTO public.approvals(
    approval_type, reference_type, reference_id, title, description, status
  ) VALUES (
    'purchase_requisition', 'purchase_requisition', requisition.id,
    'Aprobar solicitud ' || requisition.requisition_number,
    'Revisar faltantes MRP antes de crear órdenes por proveedor.', 'pending'
  ) RETURNING id INTO approval_id;
  UPDATE public.purchase_requisitions
  SET status = 'pending_approval', updated_at = now() WHERE id = requisition.id;
  RETURN approval_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_approval(p_approval_id uuid, p_decision text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  approval public.approvals%ROWTYPE;
  requisition public.purchase_requisitions%ROWTYPE;
  material public.raw_materials%ROWTYPE;
  recipe_id uuid;
  production_quantity numeric;
  order_id uuid;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Approval decisions require an administrator.';
  END IF;
  IF p_decision IS NULL OR p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Approval decision is invalid.';
  END IF;
  SELECT * INTO approval FROM public.approvals WHERE id = p_approval_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Approval not found.'; END IF;
  IF approval.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Approval is no longer pending.';
  END IF;

  IF approval.approval_type = 'purchase_requisition'
    AND approval.reference_type = 'purchase_requisition' THEN
    SELECT * INTO requisition FROM public.purchase_requisitions
    WHERE id = approval.reference_id FOR UPDATE;
    IF requisition.status IS DISTINCT FROM 'pending_approval' THEN
      RAISE EXCEPTION 'Purchase requisition is not pending approval.';
    END IF;
    UPDATE public.purchase_requisitions SET status = p_decision,
      approved_by = CASE WHEN p_decision = 'approved' THEN auth.uid() ELSE NULL END,
      updated_at = now() WHERE id = requisition.id;
  ELSIF p_decision = 'approved' AND approval.approval_type = 'purchase'
    AND approval.reference_type = 'raw_material' THEN
    SELECT * INTO material FROM public.raw_materials
    WHERE id = approval.reference_id AND is_active = true AND deleted_at IS NULL FOR UPDATE;
    IF NOT FOUND OR material.reorder_quantity IS NULL OR material.reorder_quantity <= 0 THEN
      RAISE EXCEPTION 'Raw material is not available for automatic purchase.';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.suppliers WHERE id = material.preferred_supplier_id
      AND is_active = true AND deleted_at IS NULL
    ) THEN RAISE EXCEPTION 'Preferred supplier is not available.'; END IF;
    INSERT INTO public.purchase_orders(
      order_number, supplier_id, status, subtotal, total, notes
    ) VALUES (
      'PO-AUTO-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(approval.id::text), 1, 8)),
      material.preferred_supplier_id, 'draft',
      round(material.reorder_quantity * material.last_cost, 4),
      round(material.reorder_quantity * material.last_cost, 4),
      'Generada desde aprobación automática'
    ) RETURNING id INTO order_id;
    INSERT INTO public.purchase_order_items(
      purchase_order_id, raw_material_id, quantity, unit_cost, total, received_quantity
    ) VALUES (
      order_id, material.id, material.reorder_quantity, material.last_cost,
      round(material.reorder_quantity * material.last_cost, 4), 0
    );
  ELSIF p_decision = 'approved' AND approval.approval_type = 'production'
    AND approval.reference_type = 'product' THEN
    SELECT recipe.id INTO recipe_id FROM public.recipes recipe
    WHERE recipe.product_id = approval.reference_id AND recipe.is_active = true
    ORDER BY recipe.updated_at DESC NULLS LAST, recipe.id LIMIT 1;
    SELECT forecast.suggested_production INTO production_quantity
    FROM public.demand_forecasts forecast WHERE forecast.product_id = approval.reference_id
    ORDER BY forecast.calculated_at DESC, forecast.id LIMIT 1;
    IF recipe_id IS NULL OR coalesce(production_quantity, 0) <= 0 THEN
      RAISE EXCEPTION 'Production approval has no active recipe or suggested quantity.';
    END IF;
    INSERT INTO public.production_orders(
      production_number, recipe_id, production_status, planned_quantity,
      produced_quantity, notes, created_by
    ) VALUES (
      'PRD-AUTO-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(approval.id::text), 1, 8)),
      recipe_id, 'draft', ceil(production_quantity)::integer, 0,
      'Generada desde aprobación automática', auth.uid()
    );
  END IF;

  UPDATE public.approvals SET status = p_decision,
    approved_by = CASE WHEN p_decision = 'approved' THEN auth.uid() ELSE NULL END,
    approved_at = CASE WHEN p_decision = 'approved' THEN now() ELSE NULL END,
    rejected_at = CASE WHEN p_decision = 'rejected' THEN now() ELSE NULL END,
    updated_at = now() WHERE id = approval.id;
  RETURN approval.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.convert_purchase_requisition_to_orders(p_requisition_id uuid)
RETURNS uuid[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  requisition public.purchase_requisitions%ROWTYPE;
  supplier_row record;
  order_id uuid;
  order_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Purchase requisition management requires an administrator.';
  END IF;
  SELECT * INTO requisition FROM public.purchase_requisitions
  WHERE id = p_requisition_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Purchase requisition not found.'; END IF;
  IF requisition.status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'Requisition is not approved.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.purchase_requisition_items item
    LEFT JOIN public.raw_materials material ON material.id = item.raw_material_id
      AND material.is_active = true AND material.deleted_at IS NULL
    LEFT JOIN public.suppliers supplier ON supplier.id = material.preferred_supplier_id
      AND supplier.is_active = true AND supplier.deleted_at IS NULL
    WHERE item.purchase_requisition_id = requisition.id
      AND (material.id IS NULL OR supplier.id IS NULL)
  ) THEN RAISE EXCEPTION 'Every requisition item requires an active material and preferred supplier.'; END IF;

  FOR supplier_row IN
    SELECT material.preferred_supplier_id AS supplier_id,
      round(sum(item.purchase_quantity * material.last_cost), 4) AS subtotal
    FROM public.purchase_requisition_items item
    JOIN public.raw_materials material ON material.id = item.raw_material_id
    WHERE item.purchase_requisition_id = requisition.id
    GROUP BY material.preferred_supplier_id
    ORDER BY material.preferred_supplier_id
  LOOP
    INSERT INTO public.purchase_orders(
      order_number, supplier_id, purchase_requisition_id, status, subtotal, total, notes
    ) VALUES (
      'PO-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(
        md5(requisition.id::text || supplier_row.supplier_id::text), 1, 8
      )), supplier_row.supplier_id, requisition.id, 'draft',
      supplier_row.subtotal, supplier_row.subtotal,
      'Generada desde ' || requisition.requisition_number
    ) RETURNING id INTO order_id;
    INSERT INTO public.purchase_order_items(
      purchase_order_id, raw_material_id, quantity, unit_cost, total, received_quantity
    )
    SELECT order_id, item.raw_material_id, item.purchase_quantity, material.last_cost,
      round(item.purchase_quantity * material.last_cost, 4), 0
    FROM public.purchase_requisition_items item
    JOIN public.raw_materials material ON material.id = item.raw_material_id
    WHERE item.purchase_requisition_id = requisition.id
      AND material.preferred_supplier_id = supplier_row.supplier_id;
    order_ids := array_append(order_ids, order_id);
  END LOOP;
  IF cardinality(order_ids) = 0 THEN RAISE EXCEPTION 'Purchase requisition has no items.'; END IF;
  UPDATE public.purchase_requisitions
  SET status = 'converted', updated_at = now() WHERE id = requisition.id;
  RETURN order_ids;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_purchase_approvals()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  created_count integer;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Approval management requires an administrator.';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('create_purchase_approvals', 0));
  INSERT INTO public.approvals(
    approval_type, reference_type, reference_id, title, description, status
  )
  SELECT 'purchase', 'raw_material', material.id, 'Compra sugerida',
    'Comprar ' || material.reorder_quantity || ' de ' || material.name || '.', 'pending'
  FROM public.raw_materials material
  LEFT JOIN (
    SELECT item_id, sum(quantity) AS quantity FROM public.inventory_stock_by_item
    WHERE item_type = 'raw_material' GROUP BY item_id
  ) stock ON stock.item_id = material.id
  WHERE material.is_active = true AND material.deleted_at IS NULL
    AND coalesce(material.reorder_quantity, 0) > 0
    AND coalesce(stock.quantity, 0) <= material.minimum_stock
    AND NOT EXISTS (
      SELECT 1 FROM public.approvals existing
      WHERE existing.approval_type = 'purchase'
        AND existing.reference_type = 'raw_material'
        AND existing.reference_id = material.id AND existing.status = 'pending'
    )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS created_count = ROW_COUNT;
  RETURN created_count;
END;
$$;

REVOKE INSERT, UPDATE, DELETE ON public.purchase_requisitions,
  public.purchase_requisition_items FROM anon, authenticated;
GRANT SELECT ON public.purchase_requisitions, public.purchase_requisition_items TO authenticated;

REVOKE ALL ON FUNCTION public.create_purchase_requisition_from_mrp() FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.submit_purchase_requisition(uuid) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.decide_approval(uuid, text) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.convert_purchase_requisition_to_orders(uuid) FROM PUBLIC, anon, service_role;
REVOKE ALL ON FUNCTION public.create_purchase_approvals() FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.create_purchase_requisition_from_mrp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_purchase_requisition(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decide_approval(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.convert_purchase_requisition_to_orders(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_purchase_approvals() TO authenticated;
