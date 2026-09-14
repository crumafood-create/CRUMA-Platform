BEGIN;

INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES
 ('e1000000-0000-0000-0000-000000000001','authenticated','authenticated','lot-admin@example.test',now(),now()),
 ('e1000000-0000-0000-0000-000000000002','authenticated','authenticated','lot-user@example.test',now(),now());
INSERT INTO public.profiles(id,full_name,email,role) VALUES
 ('e1000000-0000-0000-0000-000000000001','Lot Admin','lot-admin@example.test','admin'),
 ('e1000000-0000-0000-0000-000000000002','Lot User','lot-user@example.test','client');
INSERT INTO public.user_roles(user_id,role)
VALUES ('e1000000-0000-0000-0000-000000000001','admin');
INSERT INTO public.warehouses(id,code,name)
VALUES ('e2000000-0000-0000-0000-000000000001','LOT-WH','Lot Warehouse');
INSERT INTO public.inventory_locations(id,slug,name)
VALUES ('e3000000-0000-0000-0000-000000000001','lot-location','Lot Location');
INSERT INTO public.products(id,slug,internal_code,name,status)
VALUES ('e4000000-0000-0000-0000-000000000001','lot-product','LOT-P1','Lot Product','active');
INSERT INTO public.recipes(id,product_id,name,is_active)
VALUES ('e5000000-0000-0000-0000-000000000001','e4000000-0000-0000-0000-000000000001','Lot Recipe',true);
INSERT INTO public.raw_materials(id,slug,name)
VALUES ('e6000000-0000-0000-0000-000000000001','lot-material','Lot Material');
INSERT INTO public.raw_material_lots(
 id,raw_material_id,lot_number,quantity,unit_cost,inventory_location_id
) VALUES (
 'e7000000-0000-0000-0000-000000000001','e6000000-0000-0000-0000-000000000001',
 'RM-001',10,2,'e3000000-0000-0000-0000-000000000001'
);
INSERT INTO public.production_orders(
 id,production_number,recipe_id,production_status,planned_quantity,produced_quantity,completed_at
) VALUES (
 'e8000000-0000-0000-0000-000000000001','LOT-PRD-1',
 'e5000000-0000-0000-0000-000000000001','completed',7,7,now()
);
INSERT INTO public.production_order_items(
 id,production_order_id,raw_material_id,planned_quantity,consumed_quantity,status
) VALUES (
 'e9000000-0000-0000-0000-000000000001','e8000000-0000-0000-0000-000000000001',
 'e6000000-0000-0000-0000-000000000001',7,7,'completed'
);
INSERT INTO public.production_order_consumptions(
 production_order_item_id,raw_material_lot_id,quantity,unit_cost,total_cost
) VALUES (
 'e9000000-0000-0000-0000-000000000001','e7000000-0000-0000-0000-000000000001',7,2,14
);
INSERT INTO public.production_outputs(
 id,production_order_id,product_id,quantity_produced,quality_status
) VALUES
 ('ea000000-0000-0000-0000-000000000001','e8000000-0000-0000-0000-000000000001',
  'e4000000-0000-0000-0000-000000000001',3,'released'),
 ('ea000000-0000-0000-0000-000000000002','e8000000-0000-0000-0000-000000000001',
  'e4000000-0000-0000-0000-000000000001',4,'released');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-0000-0000-000000000002',true);
DO $test$ BEGIN
  BEGIN
    PERFORM public.release_production_output_to_inventory(
      'ea000000-0000-0000-0000-000000000001','PT-001','2099-01-01',
      'e2000000-0000-0000-0000-000000000001','e3000000-0000-0000-0000-000000000001'
    );
    RAISE EXCEPTION 'normal user released a production lot';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-0000-0000-000000000001',true);
SELECT public.release_production_output_to_inventory(
 'ea000000-0000-0000-0000-000000000001','PT-001','2099-01-01',
 'e2000000-0000-0000-0000-000000000001','e3000000-0000-0000-0000-000000000001'
);
SELECT public.release_production_output_to_inventory(
 'ea000000-0000-0000-0000-000000000002','PT-002','2099-02-01',
 'e2000000-0000-0000-0000-000000000001','e3000000-0000-0000-0000-000000000001'
);

RESET ROLE;
INSERT INTO public.customers(id,customer_code,name)
VALUES ('eb000000-0000-0000-0000-000000000001','LOT-C1','Lot Customer');
INSERT INTO public.sales_orders(id,order_number,customer_id,status)
VALUES ('ec000000-0000-0000-0000-000000000001','LOT-SO-1','eb000000-0000-0000-0000-000000000001','confirmed');
INSERT INTO public.picking_orders(id,sales_order_id,status)
VALUES ('ed000000-0000-0000-0000-000000000001','ec000000-0000-0000-0000-000000000001','pending');
INSERT INTO public.picking_order_items(
 id,picking_order_id,product_id,quantity,picked_quantity,status
) VALUES (
 'ee000000-0000-0000-0000-000000000001','ed000000-0000-0000-0000-000000000001',
 'e4000000-0000-0000-0000-000000000001',5,0,'pending'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-0000-0000-000000000001',true);
SELECT public.confirm_picking_item(
 'ee000000-0000-0000-0000-000000000001','PT-001'
);
SELECT public.confirm_picking_item(
 'ee000000-0000-0000-0000-000000000001','PT-002'
);

RESET ROLE;
DO $test$ BEGIN
  IF (SELECT count(*) FROM public.production_lot_traceability) <> 2 THEN
    RAISE EXCEPTION 'production lineage snapshot is incomplete';
  END IF;
  IF (SELECT count(*) FROM public.picking_lot_allocations) <> 2 THEN
    RAISE EXCEPTION 'picking was not split across FEFO lots';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.picking_order_items
    WHERE id='ee000000-0000-0000-0000-000000000001'
      AND picked_quantity=5 AND status='completed'
  ) THEN RAISE EXCEPTION 'split picking did not complete'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.product_lots
    WHERE lot_number='PT-001' AND (quantity<>0 OR status<>'depleted')
  ) THEN RAISE EXCEPTION 'first FEFO lot was not depleted'; END IF;
END;
$test$;

ROLLBACK;
