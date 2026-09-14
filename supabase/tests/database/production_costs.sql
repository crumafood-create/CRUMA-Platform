BEGIN;

INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES
 ('c1000000-0000-0000-0000-000000000001','authenticated','authenticated','cost-admin@example.test',now(),now()),
 ('c1000000-0000-0000-0000-000000000002','authenticated','authenticated','cost-user@example.test',now(),now());
INSERT INTO public.user_roles(user_id,role)
VALUES ('c1000000-0000-0000-0000-000000000001','admin');
INSERT INTO public.products(id,slug,internal_code,name,status)
VALUES ('c2000000-0000-0000-0000-000000000001','cost-product','COST-P1','Cost Product','active');
INSERT INTO public.recipes(id,product_id,name,is_active)
VALUES ('c3000000-0000-0000-0000-000000000001','c2000000-0000-0000-0000-000000000001','Cost Recipe',true);
INSERT INTO public.raw_materials(id,slug,internal_code,name,is_active)
VALUES ('c4000000-0000-0000-0000-000000000001','cost-material','COST-M1','Cost Material',true);
INSERT INTO public.raw_material_lots(id,raw_material_id,lot_number,quantity,unit_cost,status)
VALUES ('c5000000-0000-0000-0000-000000000001','c4000000-0000-0000-0000-000000000001','COST-LOT-1',8,12.5,'available');
INSERT INTO public.production_orders(
 id,production_number,recipe_id,production_status,planned_quantity,produced_quantity,completed_at
) VALUES (
 'c6000000-0000-0000-0000-000000000001','COST-PRD-1','c3000000-0000-0000-0000-000000000001','completed',10,10,now()
);
INSERT INTO public.production_order_items(
 id,production_order_id,raw_material_id,planned_quantity,consumed_quantity,status
) VALUES (
 'c7000000-0000-0000-0000-000000000001','c6000000-0000-0000-0000-000000000001',
 'c4000000-0000-0000-0000-000000000001',2,2,'completed'
);
INSERT INTO public.production_order_consumptions(
 production_order_item_id,raw_material_lot_id,quantity,unit_cost,total_cost
) VALUES (
 'c7000000-0000-0000-0000-000000000001','c5000000-0000-0000-0000-000000000001',2,12.5,25
);
INSERT INTO public.production_outputs(
 production_order_id,product_id,quantity_produced
) VALUES ('c6000000-0000-0000-0000-000000000001','c2000000-0000-0000-0000-000000000001',10);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','c1000000-0000-0000-0000-000000000002',true);
DO $test$ BEGIN
  IF (SELECT count(*) FROM public.production_costs) <> 0 THEN
    RAISE EXCEPTION 'normal user unexpectedly read production costs';
  END IF;
  BEGIN
    PERFORM public.calculate_production_cost('c6000000-0000-0000-0000-000000000001',20,5);
    RAISE EXCEPTION 'normal user calculated production cost';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','c1000000-0000-0000-0000-000000000001',true);
SELECT public.calculate_production_cost('c6000000-0000-0000-0000-000000000001',20,5);

RESET ROLE;
UPDATE public.raw_material_lots
SET unit_cost=99
WHERE id='c5000000-0000-0000-0000-000000000001';
UPDATE public.production_order_consumptions
SET unit_cost=99, total_cost=198
WHERE production_order_item_id='c7000000-0000-0000-0000-000000000001';

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','c1000000-0000-0000-0000-000000000001',true);
SELECT public.calculate_production_cost('c6000000-0000-0000-0000-000000000001',25,5);

RESET ROLE;
DO $test$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.production_costs cost
    JOIN public.production_orders production_order ON production_order.id=cost.production_order_id
    JOIN public.production_outputs output ON output.production_order_id=cost.production_order_id
    WHERE cost.production_order_id='c6000000-0000-0000-0000-000000000001'
      AND cost.material_cost=25 AND cost.labor_cost=25 AND cost.overhead_cost=5
      AND cost.total_cost=55 AND cost.unit_cost=5.5
      AND cost.calculation_version=2 AND cost.source_consumption_count=1
      AND production_order.actual_cost=55
      AND output.total_cost=55 AND output.unit_cost=5.5
  ) THEN RAISE EXCEPTION 'production cost calculation is inconsistent'; END IF;
  IF (SELECT count(*) FROM public.production_cost_history
      WHERE production_order_id='c6000000-0000-0000-0000-000000000001') <> 2 THEN
    RAISE EXCEPTION 'production cost history is incomplete';
  END IF;
END;
$test$;

ROLLBACK;
