BEGIN;

INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES
 ('d1000000-0000-0000-0000-000000000001','authenticated','authenticated','quality-admin@example.test',now(),now()),
 ('d1000000-0000-0000-0000-000000000002','authenticated','authenticated','quality-user@example.test',now(),now());
INSERT INTO public.profiles(id,full_name,email,role) VALUES
 ('d1000000-0000-0000-0000-000000000001','Quality Admin','quality-admin@example.test','admin'),
 ('d1000000-0000-0000-0000-000000000002','Quality User','quality-user@example.test','client');
INSERT INTO public.user_roles(user_id,role)
VALUES ('d1000000-0000-0000-0000-000000000001','admin');
INSERT INTO public.products(id,slug,internal_code,name,status)
VALUES ('d2000000-0000-0000-0000-000000000001','quality-product','QA-P1','Quality Product','active');
INSERT INTO public.recipes(id,product_id,name,is_active)
VALUES ('d3000000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000001','Quality Recipe',true);
INSERT INTO public.production_orders(
 id,production_number,recipe_id,production_status,planned_quantity,produced_quantity,completed_at
) VALUES (
 'd4000000-0000-0000-0000-000000000001','QA-PRD-1','d3000000-0000-0000-0000-000000000001','completed',10,10,now()
);
INSERT INTO public.production_outputs(id,production_order_id,product_id,quantity_produced)
VALUES (
 'd5000000-0000-0000-0000-000000000001','d4000000-0000-0000-0000-000000000001',
 'd2000000-0000-0000-0000-000000000001',10
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d1000000-0000-0000-0000-000000000002',true);
DO $test$ BEGIN
  IF (SELECT count(*) FROM public.quality_inspections) <> 0 THEN
    RAISE EXCEPTION 'normal user unexpectedly read quality inspections';
  END IF;
  BEGIN
    PERFORM public.record_quality_inspection(
      'd5000000-0000-0000-0000-000000000001',5,NULL,
      '[{"criterion":"Apariencia","passed":true}]'::jsonb,'[]'::jsonb
    );
    RAISE EXCEPTION 'normal user recorded a quality inspection';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','d1000000-0000-0000-0000-000000000001',true);
DO $test$ DECLARE inspection_id uuid; BEGIN
  inspection_id := public.record_quality_inspection(
    'd5000000-0000-0000-0000-000000000001',5,'Liberación inicial',
    '[{"criterion":"Apariencia","expected_value":"Uniforme","actual_value":"Uniforme","passed":true}]'::jsonb,
    '[]'::jsonb
  );
  PERFORM public.decide_quality_release(inspection_id,'release','Cumple especificación');
  BEGIN
    PERFORM public.decide_quality_release(inspection_id,'release','Duplicada');
    RAISE EXCEPTION 'quality decision was recorded twice';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
END;
$test$;

RESET ROLE;
DO $test$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.quality_inspections inspection
    JOIN public.quality_release_decisions decision ON decision.inspection_id=inspection.id
    JOIN public.production_outputs output ON output.id=inspection.production_output_id
    WHERE inspection.status='passed' AND inspection.result='ok'
      AND inspection.sampled_quantity=5 AND inspection.accepted_quantity=5
      AND inspection.rejected_quantity=0 AND decision.decision='release'
      AND decision.approved_by='d1000000-0000-0000-0000-000000000001'
      AND output.quality_status='released'
  ) THEN RAISE EXCEPTION 'quality release is inconsistent'; END IF;
END;
$test$;

ROLLBACK;
