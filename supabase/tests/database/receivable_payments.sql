BEGIN;

INSERT INTO auth.users (id, aud, role, email, created_at, updated_at) VALUES
  ('8a000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'ar-admin@example.test', now(), now()),
  ('8a000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'ar-user@example.test', now(), now());

INSERT INTO public.user_roles (user_id, role)
VALUES ('8a000000-0000-0000-0000-000000000001', 'admin');

INSERT INTO public.customers (id, customer_code, customer_type, name)
VALUES ('8b000000-0000-0000-0000-000000000001', 'AR-C1', 'business', 'AR Customer');

INSERT INTO public.accounts_receivable (
  id, customer_id, document_number, amount, paid_amount, balance, status
) VALUES (
  '8c000000-0000-0000-0000-000000000001',
  '8b000000-0000-0000-0000-000000000001', 'AR-001', 100, 0, 100, 'pending'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '8a000000-0000-0000-0000-000000000002', true);

DO $test$
BEGIN
  BEGIN
    INSERT INTO public.accounts_receivable_payments (
      account_receivable_id, amount, payment_method, reference
    ) VALUES ('8c000000-0000-0000-0000-000000000001', 10, 'cash', 'DENIED');
    RAISE EXCEPTION 'normal user unexpectedly inserted a receivable payment';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.register_receivable_payment(
      '8c000000-0000-0000-0000-000000000001', current_date, 10, 'cash', 'DENIED-RPC', NULL
    );
    RAISE EXCEPTION 'normal user unexpectedly registered a receivable payment';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

RESET ROLE;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '8a000000-0000-0000-0000-000000000001', true);

SELECT public.register_receivable_payment(
  '8c000000-0000-0000-0000-000000000001', current_date, 40, 'transfer', 'SPEI-OK', 'Partial'
);

DO $test$
BEGIN
  BEGIN
    PERFORM public.register_receivable_payment(
      '8c000000-0000-0000-0000-000000000001', current_date, 40, 'transfer', 'SPEI-OK', NULL
    );
    RAISE EXCEPTION 'duplicate payment reference was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Payment reference was already registered.' THEN RAISE; END IF;
  END;
END;
$test$;

DO $test$
BEGIN
  BEGIN
    PERFORM public.register_receivable_payment(
      '8c000000-0000-0000-0000-000000000001', current_date, 61, 'cash', 'OVERPAY', NULL
    );
    RAISE EXCEPTION 'overpayment was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'Payment exceeds the outstanding balance.' THEN RAISE; END IF;
  END;
END;
$test$;

RESET ROLE;

DO $test$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.accounts_receivable
    WHERE id = '8c000000-0000-0000-0000-000000000001'
      AND paid_amount = 40 AND balance = 60 AND status = 'partial'
  ) OR (SELECT count(*) FROM public.accounts_receivable_payments
    WHERE account_receivable_id = '8c000000-0000-0000-0000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'receivable payment transaction is inconsistent';
  END IF;
END;
$test$;

ROLLBACK;
