-- Make receivable payment registration atomic, idempotent, and admin-only.
DROP POLICY IF EXISTS accounts_receivable_insert ON public.accounts_receivable;
DROP POLICY IF EXISTS accounts_receivable_update ON public.accounts_receivable;
DROP POLICY IF EXISTS accounts_receivable_delete ON public.accounts_receivable;
DROP POLICY IF EXISTS ar_payments_insert ON public.accounts_receivable_payments;
DROP POLICY IF EXISTS ar_payments_update ON public.accounts_receivable_payments;
DROP POLICY IF EXISTS ar_payments_delete ON public.accounts_receivable_payments;

CREATE POLICY accounts_receivable_admin_write ON public.accounts_receivable
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY receivable_payments_admin_write ON public.accounts_receivable_payments
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE UNIQUE INDEX accounts_receivable_payments_reference_key
  ON public.accounts_receivable_payments (account_receivable_id, lower(reference))
  WHERE reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.register_receivable_payment(
  p_account_id uuid,
  p_payment_date date,
  p_amount numeric,
  p_payment_method text,
  p_reference text,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  account_row public.accounts_receivable%ROWTYPE;
  payment_id uuid;
  remaining numeric;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE insufficient_privilege USING MESSAGE = 'Receivable payment management requires an administrator.';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount::text = 'NaN' THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero.';
  END IF;
  IF p_payment_date IS NULL OR p_payment_date > current_date THEN
    RAISE EXCEPTION 'Payment date is invalid.';
  END IF;
  IF p_payment_method IS NULL OR p_payment_method NOT IN ('cash', 'transfer', 'card', 'mercado_pago', 'other') THEN
    RAISE EXCEPTION 'Payment method is invalid.';
  END IF;
  IF nullif(trim(p_reference), '') IS NULL THEN
    RAISE EXCEPTION 'Payment reference is required.';
  END IF;

  SELECT * INTO account_row FROM public.accounts_receivable
  WHERE id = p_account_id FOR UPDATE;
  IF NOT FOUND OR account_row.status IN ('paid', 'cancelled') THEN
    RAISE EXCEPTION 'Account is unavailable for payments.';
  END IF;
  IF p_amount > account_row.balance THEN
    RAISE EXCEPTION 'Payment exceeds the outstanding balance.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.accounts_receivable_payments
    WHERE account_receivable_id = p_account_id
      AND lower(reference) = lower(trim(p_reference))) THEN
    RAISE EXCEPTION 'Payment reference was already registered.';
  END IF;

  INSERT INTO public.accounts_receivable_payments (
    account_receivable_id, payment_date, amount, payment_method, reference, notes
  ) VALUES (
    p_account_id, p_payment_date, p_amount, p_payment_method, trim(p_reference), nullif(trim(p_notes), '')
  ) RETURNING id INTO payment_id;

  remaining := round(account_row.balance - p_amount, 2);
  UPDATE public.accounts_receivable SET
    paid_amount = round(account_row.paid_amount + p_amount, 2),
    balance = remaining,
    status = CASE WHEN remaining = 0 THEN 'paid' ELSE 'partial' END,
    updated_at = now()
  WHERE id = p_account_id;
  RETURN payment_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_receivable_payment(uuid, date, numeric, text, text, text)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.register_receivable_payment(uuid, date, numeric, text, text, text)
  TO authenticated;
