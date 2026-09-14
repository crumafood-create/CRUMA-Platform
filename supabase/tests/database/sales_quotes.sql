BEGIN;
INSERT INTO auth.users(id,aud,role,email,created_at,updated_at) VALUES
 ('a4000000-0000-0000-0000-000000000001','authenticated','authenticated','quote-admin@example.test',now(),now()),
 ('a4000000-0000-0000-0000-000000000002','authenticated','authenticated','quote-user@example.test',now(),now());
INSERT INTO public.user_roles(user_id,role) VALUES('a4000000-0000-0000-0000-000000000001','admin');
INSERT INTO public.customers(id,customer_code,customer_type,name) VALUES('a5000000-0000-0000-0000-000000000001','Q-C1','business','Quote Customer');
INSERT INTO public.products(id,slug,internal_code,name,status) VALUES('a6000000-0000-0000-0000-000000000001','quote-product','Q-P1','Quote Product','active');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a4000000-0000-0000-0000-000000000002',true);
DO $test$ BEGIN
 IF (SELECT count(*) FROM public.sales_quotes)<>0 THEN RAISE EXCEPTION 'normal user unexpectedly read quotes'; END IF;
 BEGIN PERFORM public.create_sales_quote('a5000000-0000-0000-0000-000000000001',current_date+30,NULL,NULL); RAISE EXCEPTION 'normal user created quote';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END;
$test$;

RESET ROLE; SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','a4000000-0000-0000-0000-000000000001',true);
SELECT public.create_sales_quote('a5000000-0000-0000-0000-000000000001',current_date+30,'Quote note','Net 15');
SELECT public.add_sales_quote_item((SELECT id FROM public.sales_quotes WHERE customer_id='a5000000-0000-0000-0000-000000000001'),'a6000000-0000-0000-0000-000000000001',2,50,5,16);
SELECT public.transition_sales_quote((SELECT id FROM public.sales_quotes WHERE customer_id='a5000000-0000-0000-0000-000000000001'),'draft','sent');
SELECT public.transition_sales_quote((SELECT id FROM public.sales_quotes WHERE customer_id='a5000000-0000-0000-0000-000000000001'),'sent','accepted');
SELECT public.convert_sales_quote_to_order((SELECT id FROM public.sales_quotes WHERE customer_id='a5000000-0000-0000-0000-000000000001'));

DO $test$ DECLARE quote_id uuid; BEGIN
 SELECT id INTO quote_id FROM public.sales_quotes WHERE customer_id='a5000000-0000-0000-0000-000000000001';
 BEGIN PERFORM public.convert_sales_quote_to_order(quote_id); RAISE EXCEPTION 'quote converted twice';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Quote was already converted.' THEN RAISE; END IF; END;
END;
$test$;
RESET ROLE;
DO $test$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.sales_quotes q JOIN public.sales_orders o ON o.id=q.sales_order_id
   JOIN public.sales_order_items i ON i.sales_order_id=o.id WHERE q.customer_id='a5000000-0000-0000-0000-000000000001'
   AND q.status='converted' AND q.subtotal=100 AND q.discount=5 AND q.tax_amount=15.20 AND q.total_amount=110.20
   AND o.status='draft' AND o.total=110.20 AND i.total=100 AND i.discount=5) THEN
   RAISE EXCEPTION 'quote conversion or totals are inconsistent'; END IF;
END;
$test$;
ROLLBACK;
