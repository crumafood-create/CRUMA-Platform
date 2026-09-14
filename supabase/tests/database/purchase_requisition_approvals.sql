BEGIN;

INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES
 ('b1000000-0000-0000-0000-000000000001','authenticated','authenticated','requisition-admin@example.test',now(),now()),
 ('b1000000-0000-0000-0000-000000000002','authenticated','authenticated','requisition-user@example.test',now(),now());
INSERT INTO public.user_roles(user_id,role)
VALUES ('b1000000-0000-0000-0000-000000000001','admin');
INSERT INTO public.suppliers(id,name,is_active)
VALUES ('b2000000-0000-0000-0000-000000000001','Requisition Supplier',true);
INSERT INTO public.raw_materials(
  id,slug,internal_code,name,current_stock,minimum_stock,reorder_quantity,last_cost,
  preferred_supplier_id,is_active
) VALUES (
  'b3000000-0000-0000-0000-000000000001','requisition-material','REQ-M1','Requisition Material',0,5,10,12.5,
  'b2000000-0000-0000-0000-000000000001',true
);
INSERT INTO public.products(id,slug,internal_code,name,status)
VALUES ('b4000000-0000-0000-0000-000000000001','requisition-product','REQ-P1','Requisition Product','active');
INSERT INTO public.recipes(id,product_id,name,is_active)
VALUES ('b5000000-0000-0000-0000-000000000001','b4000000-0000-0000-0000-000000000001','Requisition Recipe',true);
INSERT INTO public.recipe_items(recipe_id,raw_material_id,quantity)
VALUES ('b5000000-0000-0000-0000-000000000001','b3000000-0000-0000-0000-000000000001',1);
INSERT INTO public.production_orders(
  production_number,recipe_id,production_status,planned_quantity,produced_quantity
) VALUES ('REQ-PRD-1','b5000000-0000-0000-0000-000000000001','released',10,0);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b1000000-0000-0000-0000-000000000002',true);
DO $test$ BEGIN
  IF (SELECT count(*) FROM public.purchase_requisitions) <> 0 THEN
    RAISE EXCEPTION 'normal user unexpectedly read purchase requisitions';
  END IF;
  BEGIN
    PERFORM public.create_purchase_requisition_from_mrp();
    RAISE EXCEPTION 'normal user created purchase requisition';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','b1000000-0000-0000-0000-000000000001',true);
SELECT public.create_purchase_requisition_from_mrp();
SELECT public.submit_purchase_requisition((SELECT id FROM public.purchase_requisitions));
SELECT public.decide_approval((SELECT id FROM public.approvals WHERE approval_type='purchase_requisition'),'approved');
SELECT public.convert_purchase_requisition_to_orders((SELECT id FROM public.purchase_requisitions));

DO $test$ DECLARE requisition_id uuid; approval_id uuid; BEGIN
  SELECT id INTO requisition_id FROM public.purchase_requisitions;
  SELECT id INTO approval_id FROM public.approvals WHERE reference_id=requisition_id;
  BEGIN
    PERFORM public.decide_approval(approval_id,'approved');
    RAISE EXCEPTION 'approval was decided twice';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Approval is no longer pending.' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.convert_purchase_requisition_to_orders(requisition_id);
    RAISE EXCEPTION 'requisition was converted twice';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Requisition is not approved.' THEN RAISE; END IF;
  END;
END;
$test$;

RESET ROLE;
DO $test$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.purchase_requisitions requisition
    JOIN public.purchase_orders purchase_order
      ON purchase_order.purchase_requisition_id=requisition.id
    JOIN public.purchase_order_items item ON item.purchase_order_id=purchase_order.id
    WHERE requisition.status='converted'
      AND requisition.requested_by='b1000000-0000-0000-0000-000000000001'
      AND requisition.approved_by='b1000000-0000-0000-0000-000000000001'
      AND purchase_order.supplier_id='b2000000-0000-0000-0000-000000000001'
      AND purchase_order.total=125
      AND item.quantity=10
      AND item.unit_cost=12.5
      AND item.total=125
  ) THEN RAISE EXCEPTION 'requisition approval conversion is inconsistent'; END IF;
END;
$test$;

ROLLBACK;
