


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."payment_method_type" AS ENUM (
    'card',
    'transfer',
    'cash',
    'oxxo',
    'paypal',
    'spei',
    'terminal',
    'manual'
);


ALTER TYPE "public"."payment_method_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_proof_status" AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE "public"."payment_proof_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_provider_type" AS ENUM (
    'stripe',
    'mercado_pago',
    'conekta',
    'paypal',
    'manual',
    'cash',
    'terminal'
);


ALTER TYPE "public"."payment_provider_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'processing',
    'authorized',
    'paid',
    'partially_paid',
    'failed',
    'expired',
    'cancelled',
    'refunded',
    'chargeback'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."reconciliation_status" AS ENUM (
    'pending',
    'matched',
    'mismatch',
    'manual_review',
    'resolved'
);


ALTER TYPE "public"."reconciliation_status" OWNER TO "postgres";


CREATE TYPE "public"."tenant_member_role" AS ENUM (
    'owner',
    'admin',
    'member',
    'viewer'
);


ALTER TYPE "public"."tenant_member_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_production_order_items"("p_production_order_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
      declare
          v_recipe_id uuid;
              v_quantity numeric;
                  r record;
                  begin

                      select
                              recipe_id,
                                      planned_quantity
                                          into
                                                  v_recipe_id,
                                                          v_quantity
                                                              from production_orders
                                                                  where id = p_production_order_id;

                                                                      if v_recipe_id is null then
                                                                              raise exception 'La orden no tiene receta';
                                                                                  end if;

                                                                                      insert into production_order_items (
                                                                                              production_order_id,
                                                                                                      raw_material_id,
                                                                                                              planned_quantity,
                                                                                                                      consumed_quantity,
                                                                                                                              status
                                                                                                                                  )
                                                                                                                                      select
                                                                                                                                              p_production_order_id,
                                                                                                                                                      ri.raw_material_id,
                                                                                                                                                              ri.quantity * v_quantity,
                                                                                                                                                                      0,
                                                                                                                                                                              'pending'
                                                                                                                                                                                  from recipe_items ri
                                                                                                                                                                                      where ri.recipe_id = v_recipe_id;

                                                                                                                                                                                      end;
                                                                                                                                                                                      $$;


ALTER FUNCTION "public"."create_production_order_items"("p_production_order_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrease_product_lot_quantity"("p_lot_id" "uuid", "p_quantity" numeric) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
      begin
        update product_lots
          set quantity =
              greatest(
                    quantity - p_quantity,
                          0
                              ),
                                    updated_at = now()
                                      where id = p_lot_id;
                                      end;
                                      $$;


ALTER FUNCTION "public"."decrease_product_lot_quantity"("p_lot_id" "uuid", "p_quantity" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin

  if new.invoice_number is null
       or new.invoice_number = '' then

           new.invoice_number :=
                 'INV-'
                       || to_char(now(), 'YYYY')
                             || '-'
                                   || lpad(
                                              nextval('public.invoice_number_seq')::text,
                                                         6,
                                                                    '0'
                                                                             );

                                                                               end if;

                                                                                 return new;
                                                                                 end;
                                                                                 $$;


ALTER FUNCTION "public"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_purchase_requisition_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
begin
  return
      'RQ-' ||
          to_char(now(), 'YYYYMMDD') ||
              '-' ||
                  upper(
                        substr(
                                md5(random()::text),
                                        1,
                                                6
                                                      )
                                                          );
                                                          end;
                                                          $$;


ALTER FUNCTION "public"."generate_purchase_requisition_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
                      BEGIN
                        INSERT INTO public.profiles (id, full_name, email)
                          VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
                            RETURN NEW;
                            END;
                            $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT EXISTS (
      SELECT 1
          FROM public.user_roles
              WHERE user_id = p_user_id
                    AND role = 'admin'
                      );
                      $$;


ALTER FUNCTION "public"."is_admin"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_order_status_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin

  if old.status is distinct from new.status then

      insert into public.order_status_history (
            order_id,
                  previous_status,
                        new_status,
                              changed_by
                                  )
                                      values (
                                            new.id,
                                                  old.status,
                                                        new.status,
                                                              auth.uid()
                                                                  );

                                                                    end if;

                                                                      return new;
                                                                      end;
                                                                      $$;


ALTER FUNCTION "public"."log_order_status_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalculate_cart_totals"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  cart_uuid uuid;
  begin

    cart_uuid :=
        coalesce(new.cart_id, old.cart_id);

          update public.carts
            set
                subtotal = coalesce((
                      select sum(line_total)
                            from public.cart_items
                                  where cart_id = cart_uuid
                                      ), 0),

                                          total = coalesce((
                                                select sum(line_total)
                                                      from public.cart_items
                                                            where cart_id = cart_uuid
                                                                ), 0) - discount_total

                                                                  where id = cart_uuid;

                                                                    return null;
                                                                    end;
                                                                    $$;


ALTER FUNCTION "public"."recalculate_cart_totals"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
                                                                                                                                                                                                                                                                                                                  begin
                                                                                                                                                                                                                                                                                                                    new.updated_at = now();
                                                                                                                                                                                                                                                                                                                      return new;
                                                                                                                                                                                                                                                                                                                      end;
                                                                                                                                                                                                                                                                                                                      $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_order_payment_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin

  update public.orders
    set payment_status =
        case
              when new.status = 'paid'
                      then 'paid'

                            when new.status = 'refunded'
                                    then 'refunded'

                                          when new.status = 'partially_refunded'
                                                  then 'partially_refunded'

                                                        when new.status = 'failed'
                                                                then 'failed'

                                                                      else 'pending'
                                                                          end

                                                                            where id = new.order_id;

                                                                              return new;
                                                                              end;
                                                                              $$;


ALTER FUNCTION "public"."sync_order_payment_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_order_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
                                                                BEGIN
                                                                  NEW.updated_at = NOW();
                                                                    RETURN NEW;
                                                                    END;
                                                                    $$;


ALTER FUNCTION "public"."update_order_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."abandoned_carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "cart_id" "uuid",
    "cart_snapshot" "jsonb" NOT NULL,
    "cart_total" numeric(14,2),
    "recovered" boolean DEFAULT false,
    "recovered_order_id" "uuid",
    "abandoned_at" timestamp with time zone DEFAULT "now"(),
    "recovered_at" timestamp with time zone
);


ALTER TABLE "public"."abandoned_carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounts_receivable" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "sales_order_id" "uuid",
    "document_number" "text",
    "amount" numeric(14,2) NOT NULL,
    "paid_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "balance" numeric(14,2) NOT NULL,
    "due_date" "date",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "accounts_receivable_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'partial'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."accounts_receivable" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."accounts_receivable_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "account_receivable_id" "uuid" NOT NULL,
    "payment_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "amount" numeric(14,2) NOT NULL,
    "payment_method" "text",
    "reference" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."accounts_receivable_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_product_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_product_id" "uuid" NOT NULL,
    "recommended_product_id" "uuid" NOT NULL,
    "recommendation_type" "text",
    "score" numeric(10,4),
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_product_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_search_queries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "search_query" "text" NOT NULL,
    "embedding" "public"."vector"(1536),
    "results_count" integer,
    "clicked_product_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_search_queries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "event_type" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" "text",
    "page" "text",
    "referrer" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text",
    "total_amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'MXN'::"text",
    "payment_id" "text",
    "payment_method" "text",
    "shipping_address" "text" NOT NULL,
    "shipping_city" "text" NOT NULL,
    "tracking_number" "text",
    "estimated_delivery_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text",
    CONSTRAINT "orders_payment_status_check" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text", 'partially_refunded'::"text"]))),
    CONSTRAINT "orders_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'processing'::"text", 'shipped'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."analytics_sales_by_day" AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "day",
    "count"(*) AS "total_orders",
    "sum"("total_amount") AS "revenue"
   FROM "public"."orders" "o"
  WHERE ("payment_status" = 'paid'::"text")
  GROUP BY ("date_trunc"('day'::"text", "created_at"))
  ORDER BY ("date_trunc"('day'::"text", "created_at")) DESC;


ALTER VIEW "public"."analytics_sales_by_day" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "product_id" "uuid",
    "quantity" integer NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "subtotal" numeric(10,2) GENERATED ALWAYS AS ((("quantity")::numeric * "unit_price")) STORED,
    CONSTRAINT "order_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid",
    "family_id" "uuid",
    "flavor_id" "uuid",
    "preparation_type_id" "uuid",
    "slug" "text" NOT NULL,
    "internal_code" "text",
    "name" "text" NOT NULL,
    "short_description" "text",
    "description" "text",
    "seo_title" "text",
    "seo_description" "text",
    "image_url" "text",
    "image_alt" "text",
    "is_featured" boolean DEFAULT false,
    "status" "text" DEFAULT 'active'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "min_stock" integer DEFAULT 0,
    "unit_of_measure_id" "uuid",
    "raw_material_type" "text",
    "is_active" boolean DEFAULT true,
    CONSTRAINT "products_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."analytics_top_products" AS
 SELECT "p"."id",
    "p"."name",
    "count"(DISTINCT "oi"."order_id") AS "total_orders",
    "sum"("oi"."quantity") AS "units_sold",
    "sum"("oi"."subtotal") AS "revenue"
   FROM ("public"."order_items" "oi"
     JOIN "public"."products" "p" ON (("p"."id" = "oi"."product_id")))
  GROUP BY "p"."id", "p"."name"
  ORDER BY ("sum"("oi"."subtotal")) DESC;


ALTER VIEW "public"."analytics_top_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "approval_type" "text" NOT NULL,
    "reference_type" "text" NOT NULL,
    "reference_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejected_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."automation_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "trigger_event" "text" NOT NULL,
    "action_type" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."automation_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cart_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "cart_id" "uuid" NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "quantity" integer NOT NULL,
    "product_name" "text" NOT NULL,
    "variant_name" "text",
    "sku" "text",
    "image_url" "text",
    "unit_price" numeric(12,2) NOT NULL,
    "line_total" numeric(12,2) GENERATED ALWAYS AS ((("quantity")::numeric * "unit_price")) STORED,
    "customer_type" "text" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "cart_items_customer_type_check" CHECK (("customer_type" = ANY (ARRAY['b2c'::"text", 'b2b'::"text"]))),
    CONSTRAINT "cart_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."cart_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "currency" "text" DEFAULT 'MXN'::"text" NOT NULL,
    "customer_type" "text" DEFAULT 'b2c'::"text" NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0,
    "discount_total" numeric(12,2) DEFAULT 0,
    "total" numeric(12,2) DEFAULT 0,
    "expires_at" timestamp with time zone,
    "converted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "carts_customer_type_check" CHECK (("customer_type" = ANY (ARRAY['b2c'::"text", 'b2b'::"text"]))),
    CONSTRAINT "carts_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'converted'::"text", 'abandoned'::"text", 'expired'::"text"]))),
    CONSTRAINT "carts_user_or_session_check" CHECK ((("user_id" IS NOT NULL) OR ("session_id" IS NOT NULL)))
);


ALTER TABLE "public"."carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "code_prefix" "text"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cold_chain_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_id" "uuid",
    "route_id" "uuid",
    "temperature" numeric(5,2),
    "humidity" numeric(5,2),
    "recorded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text"
);


ALTER TABLE "public"."cold_chain_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cold_chain_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "max_delivery_hours" integer,
    "requires_frozen_vehicle" boolean DEFAULT true,
    "allow_outside_city" boolean DEFAULT false,
    "min_temperature" numeric(5,2),
    "max_temperature" numeric(5,2),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cold_chain_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupon_redemptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coupon_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "discount_amount" numeric(12,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coupon_redemptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "discount_type" "text" NOT NULL,
    "discount_value" numeric(12,2) NOT NULL,
    "minimum_order_amount" numeric(12,2),
    "usage_limit" integer,
    "used_count" integer DEFAULT 0,
    "starts_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "coupons_discount_type_check" CHECK (("discount_type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text"])))
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "label" "text",
    "recipient_name" "text" NOT NULL,
    "phone" "text",
    "country" "text" DEFAULT 'México'::"text",
    "state" "text" NOT NULL,
    "city" "text" NOT NULL,
    "municipality" "text",
    "neighborhood" "text",
    "postal_code" "text" NOT NULL,
    "street" "text" NOT NULL,
    "exterior_number" "text",
    "interior_number" "text",
    "references_text" "text",
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customer_addresses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_credit_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "payment_term_id" "uuid",
    "credit_limit" numeric(12,2) DEFAULT 0 NOT NULL,
    "available_credit" numeric(12,2) DEFAULT 0 NOT NULL,
    "current_balance" numeric(12,2) DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_credit_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_name" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customer_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_ltv" (
    "user_id" "uuid" NOT NULL,
    "total_orders" integer DEFAULT 0 NOT NULL,
    "total_spent" numeric(12,2) DEFAULT 0 NOT NULL,
    "average_ticket" numeric(12,2) DEFAULT 0 NOT NULL,
    "last_order_at" timestamp with time zone,
    "predicted_ltv" numeric(12,2),
    "churn_risk_score" numeric(5,2),
    "loyalty_score" numeric(5,2),
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_ltv" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_orders" integer DEFAULT 0,
    "total_spent" numeric(14,2) DEFAULT 0,
    "average_order_value" numeric(14,2) DEFAULT 0,
    "last_order_at" timestamp with time zone,
    "first_order_at" timestamp with time zone,
    "favorite_category_id" "uuid",
    "favorite_product_id" "uuid",
    "customer_segment" "text",
    "lifetime_value" numeric(14,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customer_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_segment_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "segment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "assigned_by" "text" DEFAULT 'system'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL
);


ALTER TABLE "public"."customer_segment_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_segments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "segment_code" "text" NOT NULL,
    "segment_name" "text" NOT NULL,
    "description" "text",
    "rules" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."customer_segments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_code" "text" NOT NULL,
    "customer_type" "text" DEFAULT 'individual'::"text" NOT NULL,
    "name" "text" NOT NULL,
    "company_name" "text",
    "tax_id" "text",
    "email" "text",
    "phone" "text",
    "mobile" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "notes" "text",
    "credit_limit" numeric(14,2) DEFAULT 0 NOT NULL,
    "current_balance" numeric(14,2) DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "customers_customer_type_check" CHECK (("customer_type" = ANY (ARRAY['individual'::"text", 'business'::"text"])))
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_sales_summary" AS
 SELECT "date_trunc"('day'::"text", "created_at") AS "day",
    "count"(DISTINCT "id") AS "total_orders",
    "sum"("total_amount") AS "revenue",
    "avg"("total_amount") AS "average_ticket",
    "count"(DISTINCT "user_id") AS "unique_customers"
   FROM "public"."orders" "o"
  WHERE ("payment_status" = 'paid'::"text")
  GROUP BY ("date_trunc"('day'::"text", "created_at"))
  ORDER BY ("date_trunc"('day'::"text", "created_at")) DESC;


ALTER VIEW "public"."dashboard_sales_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "role" "text" DEFAULT 'client'::"text",
    "business_name" "text",
    "user_type" "text",
    "rfc" "text",
    "phone" "text",
    "onboarding_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['client'::"text", 'admin'::"text", 'b2b'::"text"]))),
    CONSTRAINT "profiles_user_type_check" CHECK (("user_type" = ANY (ARRAY['persona_fisica'::"text", 'persona_moral'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_top_customers" AS
 SELECT "p"."id" AS "profile_id",
    "p"."full_name",
    "p"."email",
    "count"("o"."id") AS "total_orders",
    "sum"("o"."total_amount") AS "lifetime_value"
   FROM ("public"."orders" "o"
     JOIN "public"."profiles" "p" ON (("p"."id" = "o"."user_id")))
  WHERE ("o"."payment_status" = 'paid'::"text")
  GROUP BY "p"."id", "p"."full_name", "p"."email"
  ORDER BY ("sum"("o"."total_amount")) DESC;


ALTER VIEW "public"."dashboard_top_customers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."dashboard_top_products" AS
 SELECT "p"."id",
    "p"."name",
    "sum"("oi"."quantity") AS "units_sold",
    "sum"("oi"."subtotal") AS "revenue"
   FROM (("public"."order_items" "oi"
     JOIN "public"."products" "p" ON (("p"."id" = "oi"."product_id")))
     JOIN "public"."orders" "o" ON (("o"."id" = "oi"."order_id")))
  WHERE ("o"."payment_status" = 'paid'::"text")
  GROUP BY "p"."id", "p"."name"
  ORDER BY ("sum"("oi"."subtotal")) DESC;


ALTER VIEW "public"."dashboard_top_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deliveries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "route_id" "uuid",
    "driver_id" "uuid",
    "shipping_zone_id" "uuid",
    "warehouse_id" "uuid",
    "delivery_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "delivery_address" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "scheduled_delivery_at" timestamp with time zone,
    "estimated_delivery_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "shipping_cost" numeric(12,2) DEFAULT 0,
    "tracking_code" "text",
    "customer_notes" "text",
    "driver_notes" "text",
    "requires_cold_chain" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_drivers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "phone" "text",
    "email" "text",
    "vehicle_type" "text",
    "vehicle_plate" "text",
    "supports_frozen" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."delivery_drivers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_routes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "route_code" "text" NOT NULL,
    "route_name" "text" NOT NULL,
    "driver_id" "uuid",
    "warehouse_id" "uuid",
    "route_status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "estimated_distance_km" numeric(10,2),
    "estimated_duration_minutes" integer,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."delivery_routes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shipping_zone_id" "uuid",
    "name" "text" NOT NULL,
    "day_of_week" integer,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "max_orders" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "delivery_slots_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."delivery_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "latitude" numeric(10,7),
    "longitude" numeric(10,7),
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."delivery_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."demand_forecasts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "period_days" integer DEFAULT 30 NOT NULL,
    "average_daily_demand" numeric(18,4) DEFAULT 0 NOT NULL,
    "forecast_quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "stock_quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "suggested_production" numeric(18,4) DEFAULT 0 NOT NULL,
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."demand_forecasts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "to_email" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "template" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "retries" integer DEFAULT 0,
    "error_message" "text",
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "email_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."email_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."families" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "internal_code" "text" NOT NULL
);


ALTER TABLE "public"."families" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."flavors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."flavors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "unit" "text" NOT NULL,
    "ingredient_type" "text",
    "cost_per_unit" numeric(12,4),
    "minimum_stock" numeric(12,2) DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_variant_id" "uuid" NOT NULL,
    "previous_stock" integer NOT NULL,
    "new_stock" integer NOT NULL,
    "adjustment" integer NOT NULL,
    "reason" "text",
    "adjusted_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_adjustments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "warehouse_id" "uuid",
    "product_id" "uuid",
    "variant_id" "uuid",
    "movement_type" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "previous_stock" integer,
    "new_stock" integer,
    "reference_type" "text",
    "reference_id" "uuid",
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "item_type" "text",
    "item_id" "uuid"
);


ALTER TABLE "public"."inventory_movements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_type" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "reference_type" "text" NOT NULL,
    "reference_id" "uuid" NOT NULL,
    "quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inventory_reservations" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."inventory_stock_by_item" AS
 SELECT "warehouse_id",
    COALESCE("item_type", 'product'::"text") AS "item_type",
    COALESCE("item_id", "product_id") AS "item_id",
    "sum"(
        CASE
            WHEN ("movement_type" = 'entry'::"text") THEN "quantity"
            WHEN ("movement_type" = 'exit'::"text") THEN (- "quantity")
            ELSE 0
        END) AS "quantity"
   FROM "public"."inventory_movements"
  GROUP BY "warehouse_id", COALESCE("item_type", 'product'::"text"), COALESCE("item_id", "product_id");


ALTER VIEW "public"."inventory_stock_by_item" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."inventory_available_to_promise" AS
 SELECT "s"."item_type",
    "s"."item_id",
    "s"."quantity" AS "stock_quantity",
    COALESCE("r"."reserved_quantity", (0)::numeric) AS "reserved_quantity",
    (("s"."quantity")::numeric - COALESCE("r"."reserved_quantity", (0)::numeric)) AS "available_quantity"
   FROM ("public"."inventory_stock_by_item" "s"
     LEFT JOIN ( SELECT "inventory_reservations"."item_type",
            "inventory_reservations"."item_id",
            "sum"("inventory_reservations"."quantity") AS "reserved_quantity"
           FROM "public"."inventory_reservations"
          WHERE ("inventory_reservations"."status" = 'active'::"text")
          GROUP BY "inventory_reservations"."item_type", "inventory_reservations"."item_id") "r" ON ((("r"."item_type" = "s"."item_type") AND ("r"."item_id" = "s"."item_id"))));


ALTER VIEW "public"."inventory_available_to_promise" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_batches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "warehouse_id" "uuid",
    "product_id" "uuid" NOT NULL,
    "variant_id" "uuid",
    "batch_number" "text" NOT NULL,
    "manufactured_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "quantity" integer NOT NULL,
    "remaining_quantity" integer NOT NULL,
    "unit_cost" numeric(12,2),
    "supplier_name" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inventory_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_levels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "warehouse_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "variant_id" "uuid",
    "current_stock" integer DEFAULT 0 NOT NULL,
    "reserved_stock" integer DEFAULT 0 NOT NULL,
    "available_stock" integer GENERATED ALWAYS AS (("current_stock" - "reserved_stock")) STORED,
    "minimum_stock" integer DEFAULT 0 NOT NULL,
    "maximum_stock" integer,
    "reorder_point" integer,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inventory_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "zone" "text",
    "aisle" integer,
    "rack" integer,
    "level" integer,
    "position" integer
);


ALTER TABLE "public"."inventory_locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_lots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "item_type" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "lot_number" "text" NOT NULL,
    "quantity" numeric(14,4) DEFAULT 0 NOT NULL,
    "expiration_date" "date",
    "manufacturing_date" "date",
    "supplier_id" "uuid",
    "purchase_order_id" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "inventory_lots_item_type_check" CHECK (("item_type" = ANY (ARRAY['raw_material'::"text", 'product'::"text"])))
);


ALTER TABLE "public"."inventory_lots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_lots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "lot_number" "text" NOT NULL,
    "production_order_id" "uuid",
    "expiration_date" "date",
    "quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'available'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inventory_location_id" "uuid",
    "warehouse_id" "uuid",
    "location_name" "text"
);


ALTER TABLE "public"."product_lots" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."inventory_pick_suggestions" AS
 SELECT "id" AS "lot_id",
    "product_id",
    "lot_number",
    "quantity",
    "location_name",
    "expiration_date"
   FROM "public"."product_lots" "pl"
  WHERE ("quantity" > (0)::numeric)
  ORDER BY "expiration_date", "created_at";


ALTER VIEW "public"."inventory_pick_suggestions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."inventory_product_lots_fefo" AS
 SELECT "pl"."id",
    "pl"."product_id",
    "pl"."lot_number",
    "pl"."quantity",
    "pl"."expiration_date",
    "il"."name" AS "location_name"
   FROM ("public"."product_lots" "pl"
     LEFT JOIN "public"."inventory_locations" "il" ON (("il"."id" = "pl"."inventory_location_id")))
  WHERE ("pl"."quantity" > (0)::numeric)
  ORDER BY "pl"."expiration_date", "pl"."created_at";


ALTER VIEW "public"."inventory_product_lots_fefo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_snapshots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_variant_id" "uuid",
    "stock" integer NOT NULL,
    "reserved_stock" integer DEFAULT 0,
    "available_stock" integer GENERATED ALWAYS AS (("stock" - "reserved_stock")) STORED,
    "snapshot_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_snapshots_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "warehouse_id" "uuid",
    "product_id" "uuid",
    "variant_id" "uuid",
    "stock" integer NOT NULL,
    "reserved_stock" integer NOT NULL,
    "available_stock" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."inventory_snapshots_daily" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."inventory_stock" AS
 SELECT "product_id",
    "sum"(
        CASE
            WHEN ("movement_type" = 'entry'::"text") THEN "quantity"
            WHEN ("movement_type" = 'exit'::"text") THEN (- "quantity")
            ELSE 0
        END) AS "quantity"
   FROM "public"."inventory_movements"
  GROUP BY "product_id";


ALTER VIEW "public"."inventory_stock" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."invoice_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoice_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoice_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_id" "uuid" NOT NULL,
    "payment_transaction_id" "uuid",
    "amount" numeric(12,2) NOT NULL,
    "payment_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invoice_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "invoice_number" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "payment_term_id" "uuid",
    "invoice_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "subtotal" numeric(12,2) DEFAULT 0 NOT NULL,
    "tax_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "total_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "paid_amount" numeric(12,2) DEFAULT 0 NOT NULL,
    "remaining_balance" numeric(12,2) DEFAULT 0 NOT NULL,
    "issued_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "due_date" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."live_order_status" (
    "order_id" "uuid" NOT NULL,
    "current_status" "text" NOT NULL,
    "kitchen_status" "text",
    "packing_status" "text",
    "shipping_status" "text",
    "estimated_delivery" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."live_order_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."low_stock_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "inventory_level_id" "uuid",
    "current_stock" integer NOT NULL,
    "minimum_stock" integer NOT NULL,
    "resolved" boolean DEFAULT false NOT NULL,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."low_stock_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "production_number" "text" NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "warehouse_id" "uuid",
    "production_status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "planned_quantity" integer NOT NULL,
    "produced_quantity" integer DEFAULT 0,
    "estimated_cost" numeric(12,2),
    "actual_cost" numeric(12,2),
    "planned_start_at" timestamp with time zone,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "notes" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."production_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."raw_materials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "internal_code" "text",
    "category_id" "uuid",
    "family_id" "uuid",
    "unit_of_measure_id" "uuid",
    "current_stock" numeric(14,4) DEFAULT 0 NOT NULL,
    "minimum_stock" numeric(14,4) DEFAULT 0 NOT NULL,
    "average_cost" numeric(14,4) DEFAULT 0 NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "last_cost" numeric(12,4) DEFAULT 0 NOT NULL,
    "reorder_quantity" numeric(18,4) DEFAULT 0,
    "preferred_supplier_id" "uuid"
);


ALTER TABLE "public"."raw_materials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "raw_material_id" "uuid" NOT NULL,
    "quantity" numeric(14,4) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."recipe_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "yield_quantity" numeric(14,4) DEFAULT 1 NOT NULL,
    "unit_of_measure_id" "uuid",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."mrp_requirements" AS
 SELECT "rm"."id" AS "raw_material_id",
    "rm"."name" AS "raw_material_name",
    "sum"(("ri"."quantity" * ("po"."planned_quantity")::numeric)) AS "required_quantity"
   FROM ((("public"."production_orders" "po"
     JOIN "public"."recipes" "r" ON (("r"."id" = "po"."recipe_id")))
     JOIN "public"."recipe_items" "ri" ON (("ri"."recipe_id" = "r"."id")))
     JOIN "public"."raw_materials" "rm" ON (("rm"."id" = "ri"."raw_material_id")))
  WHERE ("po"."production_status" = ANY (ARRAY['released'::"text", 'in_progress'::"text"]))
  GROUP BY "rm"."id", "rm"."name"
  ORDER BY "rm"."name";


ALTER VIEW "public"."mrp_requirements" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."mrp_purchase_requirements" AS
 SELECT "mrp"."raw_material_id",
    "mrp"."raw_material_name",
    "mrp"."required_quantity",
    COALESCE("stock"."quantity", (0)::bigint) AS "available_quantity",
    GREATEST(("mrp"."required_quantity" - (COALESCE("stock"."quantity", (0)::bigint))::numeric), (0)::numeric) AS "purchase_quantity"
   FROM ("public"."mrp_requirements" "mrp"
     LEFT JOIN "public"."inventory_stock_by_item" "stock" ON ((("stock"."item_type" = 'raw_material'::"text") AND ("stock"."item_id" = "mrp"."raw_material_id"))))
  WHERE (GREATEST(("mrp"."required_quantity" - (COALESCE("stock"."quantity", (0)::bigint))::numeric), (0)::numeric) > (0)::numeric)
  ORDER BY "mrp"."raw_material_name";


ALTER VIEW "public"."mrp_purchase_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "severity" "text" DEFAULT 'info'::"text",
    "reference_type" "text",
    "reference_id" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_shipments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "address_snapshot" "jsonb" NOT NULL,
    "shipping_method_id" "uuid",
    "shipping_zone_id" "uuid",
    "tracking_number" "text",
    "courier_name" "text",
    "shipment_status" "text" DEFAULT 'pending'::"text",
    "shipped_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "order_shipments_shipment_status_check" CHECK (("shipment_status" = ANY (ARRAY['pending'::"text", 'prepared'::"text", 'shipped'::"text", 'in_transit'::"text", 'delivered'::"text", 'failed'::"text", 'returned'::"text"])))
);


ALTER TABLE "public"."order_shipments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_status_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "previous_status" "text",
    "new_status" "text" NOT NULL,
    "changed_by" "uuid",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_timeline" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_timeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "request_payload" "jsonb",
    "response_payload" "jsonb",
    "http_status" integer,
    "success" boolean DEFAULT false,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_transaction_id" "uuid" NOT NULL,
    "order_id" "uuid",
    "event_type" "text" NOT NULL,
    "provider" "public"."payment_provider_type",
    "provider_event_id" "text",
    "event_status" "text",
    "payload" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "headers" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "signature" "text",
    "is_verified" boolean DEFAULT false NOT NULL,
    "processed" boolean DEFAULT false NOT NULL,
    "processed_at" timestamp with time zone,
    "processing_error" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_proofs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_transaction_id" "uuid" NOT NULL,
    "order_id" "uuid" NOT NULL,
    "uploaded_by" "uuid",
    "reviewed_by" "uuid",
    "proof_url" "text" NOT NULL,
    "original_filename" "text",
    "file_size" bigint,
    "mime_type" "text",
    "notes" "text",
    "admin_notes" "text",
    "status" "public"."payment_proof_status" DEFAULT 'pending'::"public"."payment_proof_status" NOT NULL,
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_proofs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_reconciliation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_transaction_id" "uuid",
    "order_id" "uuid",
    "bank_reference" "text",
    "provider_reference" "text",
    "expected_amount" numeric(12,2),
    "received_amount" numeric(12,2),
    "currency" "text" DEFAULT 'MXN'::"text",
    "payment_date" timestamp with time zone,
    "payer_name" "text",
    "payer_bank" "text",
    "reconciliation_status" "public"."reconciliation_status" DEFAULT 'pending'::"public"."reconciliation_status",
    "reconciliation_notes" "text",
    "matched_by" "uuid",
    "matched_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_reconciliation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_terms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "days_due" integer NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_terms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "provider" "public"."payment_provider_type" NOT NULL,
    "payment_method" "public"."payment_method_type" NOT NULL,
    "status" "public"."payment_status" DEFAULT 'pending'::"public"."payment_status" NOT NULL,
    "transaction_type" "text" DEFAULT 'payment'::"text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "currency" "text" DEFAULT 'MXN'::"text" NOT NULL,
    "provider_transaction_id" "text",
    "provider_reference" "text",
    "authorization_code" "text",
    "payment_date" timestamp with time zone,
    "confirmed_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "failure_reason" "text",
    "is_manual_review" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payment_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_webhooks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "event_type" "text",
    "provider_event_id" "text",
    "payload" "jsonb" NOT NULL,
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payment_webhooks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_payment_id" "text",
    "provider_reference" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "currency" "text" DEFAULT 'MXN'::"text" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "paid_amount" numeric(12,2),
    "refunded_amount" numeric(12,2) DEFAULT 0,
    "payment_method" "text",
    "payment_details" "jsonb" DEFAULT '{}'::"jsonb",
    "paid_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "payments_provider_check" CHECK (("provider" = ANY (ARRAY['stripe'::"text", 'mercadopago'::"text", 'spei'::"text", 'bank_transfer'::"text", 'cash'::"text", 'oxxo'::"text"]))),
    CONSTRAINT "payments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'authorized'::"text", 'paid'::"text", 'failed'::"text", 'cancelled'::"text", 'refunded'::"text", 'partially_refunded'::"text"])))
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."picking_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "picking_order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "product_lot_id" "uuid",
    "inventory_location_id" "uuid",
    "quantity" numeric(18,4) NOT NULL,
    "picked_quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."picking_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."picking_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."picking_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."preparation_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."preparation_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."price_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "old_price" numeric(10,2),
    "new_price" numeric(10,2) NOT NULL,
    "changed_by" "uuid",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."price_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pricing_rules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "customer_type" "text",
    "minimum_quantity" integer,
    "discount_percentage" numeric(5,2),
    "applies_to_all_products" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "starts_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "pricing_rules_customer_type_check" CHECK (("customer_type" = ANY (ARRAY['b2c'::"text", 'b2b'::"text"])))
);


ALTER TABLE "public"."pricing_rules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_analytics_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "analytics_date" "date" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "views" integer DEFAULT 0,
    "add_to_cart" integer DEFAULT 0,
    "purchases" integer DEFAULT 0,
    "revenue" numeric(14,2) DEFAULT 0,
    "conversion_rate" numeric(8,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_analytics_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_badge_relations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "badge_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_badge_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_embeddings" (
    "product_id" "uuid" NOT NULL,
    "embedding" "public"."vector"(1536),
    "generated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_embeddings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_families" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_families" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_forecasting" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "variant_id" "uuid",
    "forecast_date" "date" NOT NULL,
    "predicted_demand" integer NOT NULL,
    "confidence_score" numeric(5,2),
    "model_version" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."product_forecasting" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "alt_text" "text",
    "sort_order" integer DEFAULT 0,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_nutrition" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "serving_size" "text",
    "calories" numeric(10,2),
    "protein" numeric(10,2),
    "fat" numeric(10,2),
    "carbs" numeric(10,2),
    "sodium" numeric(10,2),
    "sugar" numeric(10,2),
    "allergens" "text"[],
    "ingredients" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_nutrition" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_recommendations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_product_id" "uuid",
    "recommended_product_id" "uuid",
    "score" numeric(10,4) DEFAULT 0,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_recommendations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_seo" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "meta_title" "text",
    "meta_description" "text",
    "canonical_url" "text",
    "og_image" "text",
    "keywords" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_seo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_tag_relations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_tag_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "sku" "text" NOT NULL,
    "variant_name" "text" NOT NULL,
    "presentation_type" "text" NOT NULL,
    "customer_type" "text" NOT NULL,
    "unit_label" "text",
    "pieces" integer,
    "weight_grams" integer,
    "price" numeric(10,2) NOT NULL,
    "compare_at_price" numeric(10,2),
    "stock" integer DEFAULT 0,
    "min_order_qty" integer DEFAULT 1,
    "max_order_qty" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "product_variants_customer_type_check" CHECK (("customer_type" = ANY (ARRAY['b2c'::"text", 'b2b'::"text"]))),
    CONSTRAINT "product_variants_presentation_type_check" CHECK (("presentation_type" = ANY (ARRAY['package'::"text", 'box'::"text"])))
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_consumptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "production_order_id" "uuid" NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "quantity_used" numeric(12,4) NOT NULL,
    "unit_cost" numeric(12,4),
    "total_cost" numeric(12,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."production_consumptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_costs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "production_order_id" "uuid" NOT NULL,
    "material_cost" numeric(18,4) DEFAULT 0 NOT NULL,
    "labor_cost" numeric(18,4) DEFAULT 0 NOT NULL,
    "overhead_cost" numeric(18,4) DEFAULT 0 NOT NULL,
    "total_cost" numeric(18,4) DEFAULT 0 NOT NULL,
    "unit_cost" numeric(18,4) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."production_costs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_lines" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "daily_capacity" numeric(18,4) DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."production_lines" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_lot_consumptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "production_order_id" "uuid" NOT NULL,
    "inventory_lot_id" "uuid" NOT NULL,
    "raw_material_id" "uuid" NOT NULL,
    "quantity" numeric(14,4) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."production_lot_consumptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_order_consumptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "production_order_item_id" "uuid" NOT NULL,
    "raw_material_lot_id" "uuid" NOT NULL,
    "quantity" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."production_order_consumptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "production_order_id" "uuid" NOT NULL,
    "raw_material_id" "uuid" NOT NULL,
    "planned_quantity" numeric DEFAULT 0 NOT NULL,
    "consumed_quantity" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."production_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_outputs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "production_order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "variant_id" "uuid",
    "batch_id" "uuid",
    "quantity_produced" integer NOT NULL,
    "unit_cost" numeric(12,4),
    "total_cost" numeric(12,2),
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."production_outputs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."production_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "production_order_id" "uuid" NOT NULL,
    "scheduled_date" "date" NOT NULL,
    "scheduled_start_time" time without time zone,
    "scheduled_end_time" time without time zone,
    "planned_quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "production_line" "text",
    "status" "text" DEFAULT 'planned'::"text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."production_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proof_of_delivery" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "delivery_id" "uuid" NOT NULL,
    "photo_url" "text",
    "signature_url" "text",
    "receiver_name" "text",
    "receiver_phone" "text",
    "notes" "text",
    "delivered_by" "uuid",
    "delivered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."proof_of_delivery" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "raw_material_id" "uuid" NOT NULL,
    "quantity" numeric(14,4) NOT NULL,
    "unit_cost" numeric(14,4) DEFAULT 0 NOT NULL,
    "total" numeric(14,4) DEFAULT 0 NOT NULL,
    "received_quantity" numeric(14,4) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchase_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" "text" NOT NULL,
    "supplier_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "order_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "expected_date" "date",
    "subtotal" numeric(14,4) DEFAULT 0 NOT NULL,
    "total" numeric(14,4) DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_requisition_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_requisition_id" "uuid" NOT NULL,
    "raw_material_id" "uuid" NOT NULL,
    "required_quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "available_quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "purchase_quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchase_requisition_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_requisitions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "requisition_number" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "notes" "text",
    "requested_by" "uuid",
    "approved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."purchase_requisitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."raw_material_lots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "raw_material_id" "uuid" NOT NULL,
    "lot_number" "text" NOT NULL,
    "supplier_lot" "text",
    "expiration_date" "date",
    "quantity" numeric(18,4) DEFAULT 0 NOT NULL,
    "unit_cost" numeric(18,4) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "inventory_location_id" "uuid"
);


ALTER TABLE "public"."raw_material_lots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipe_ingredients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "recipe_id" "uuid" NOT NULL,
    "ingredient_id" "uuid" NOT NULL,
    "quantity" numeric(12,4) NOT NULL,
    "unit" "text" NOT NULL,
    "waste_percentage" numeric(5,2) DEFAULT 0,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recipe_ingredients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refunds" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "payment_id" "uuid" NOT NULL,
    "amount" numeric(12,2) NOT NULL,
    "reason" "text",
    "provider_refund_id" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "refunds_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."refunds" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."related_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid" NOT NULL,
    "related_product_id" "uuid" NOT NULL,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."related_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_daily" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_date" "date" NOT NULL,
    "total_orders" integer DEFAULT 0,
    "gross_revenue" numeric(14,2) DEFAULT 0,
    "discounts_total" numeric(14,2) DEFAULT 0,
    "shipping_total" numeric(14,2) DEFAULT 0,
    "net_revenue" numeric(14,2) DEFAULT 0,
    "average_order_value" numeric(14,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales_daily" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "quantity" numeric(14,4) NOT NULL,
    "unit_price" numeric(14,2) NOT NULL,
    "discount" numeric(14,2) DEFAULT 0 NOT NULL,
    "total" numeric(14,2) NOT NULL,
    "delivered_quantity" numeric(14,4) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales_order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_order_profit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sales_order_id" "uuid" NOT NULL,
    "sales_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "cost_amount" numeric(14,2) DEFAULT 0 NOT NULL,
    "gross_profit" numeric(14,2) DEFAULT 0 NOT NULL,
    "margin_percent" numeric(8,2) DEFAULT 0 NOT NULL,
    "calculated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sales_order_profit" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_number" "text" NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "order_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "delivery_date" "date",
    "subtotal" numeric(14,2) DEFAULT 0 NOT NULL,
    "discount" numeric(14,2) DEFAULT 0 NOT NULL,
    "tax" numeric(14,2) DEFAULT 0 NOT NULL,
    "total" numeric(14,2) DEFAULT 0 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sales_orders_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'confirmed'::"text", 'preparing'::"text", 'ready'::"text", 'delivered'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."sales_orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scheduled_jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "job_key" "text" NOT NULL,
    "cron_expression" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "last_run_at" timestamp with time zone,
    "next_run_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."scheduled_jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_methods" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "supports_b2b" boolean DEFAULT true,
    "supports_b2c" boolean DEFAULT true,
    "supports_frozen" boolean DEFAULT true,
    "estimated_days_min" integer,
    "estimated_days_max" integer,
    "is_pickup" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipping_methods" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_rates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "zone_id" "uuid" NOT NULL,
    "method_id" "uuid" NOT NULL,
    "min_weight" numeric(10,2) DEFAULT 0,
    "max_weight" numeric(10,2),
    "min_order_total" numeric(12,2) DEFAULT 0,
    "price" numeric(12,2) NOT NULL,
    "free_shipping" boolean DEFAULT false,
    "cold_chain_required" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipping_rates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shipping_zones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "base_shipping_cost" numeric(12,2) DEFAULT 0,
    "minimum_order_amount" numeric(12,2) DEFAULT 0,
    "estimated_delivery_hours" integer,
    "supports_same_day" boolean DEFAULT false NOT NULL,
    "supports_frozen" boolean DEFAULT true NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "polygon" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."shipping_zones" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_variant_id" "uuid",
    "current_stock" integer NOT NULL,
    "minimum_stock" integer NOT NULL,
    "resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stock_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "cart_id" "uuid",
    "warehouse_id" "uuid",
    "product_id" "uuid" NOT NULL,
    "variant_id" "uuid",
    "quantity" integer NOT NULL,
    "reservation_status" "text" DEFAULT 'active'::"text" NOT NULL,
    "expires_at" timestamp with time zone,
    "released_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stock_reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "business_name" "text",
    "tax_id" "text",
    "email" "text",
    "phone" "text",
    "contact_name" "text",
    "address" "text",
    "notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_members" (
    "tenant_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."tenant_member_role" DEFAULT 'member'::"public"."tenant_member_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenant_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."units_of_measure" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "code" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."units_of_measure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_admin_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permission_id" "uuid" NOT NULL,
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_admin_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'customer'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."warehouses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "warehouse_type" "text" DEFAULT 'main'::"text" NOT NULL,
    "supports_frozen" boolean DEFAULT true NOT NULL,
    "address" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."warehouses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waste_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "warehouse_id" "uuid",
    "ingredient_id" "uuid",
    "product_id" "uuid",
    "waste_type" "text" NOT NULL,
    "quantity" numeric(12,2) NOT NULL,
    "reason" "text",
    "estimated_loss" numeric(12,2),
    "recorded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."waste_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."webhook_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider" "text" NOT NULL,
    "event_type" "text" NOT NULL,
    "external_id" "text",
    "payload" "jsonb" NOT NULL,
    "processed" boolean DEFAULT false,
    "processed_at" timestamp with time zone,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."webhook_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."whatsapp_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "phone" "text" NOT NULL,
    "template" "text" NOT NULL,
    "payload" "jsonb" DEFAULT '{}'::"jsonb",
    "status" "text" DEFAULT 'pending'::"text",
    "retries" integer DEFAULT 0,
    "error_message" "text",
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    "sent_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "whatsapp_queue_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'sent'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."whatsapp_queue" OWNER TO "postgres";


ALTER TABLE ONLY "public"."abandoned_carts"
    ADD CONSTRAINT "abandoned_carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts_receivable_payments"
    ADD CONSTRAINT "accounts_receivable_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_permissions"
    ADD CONSTRAINT "admin_permissions_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."admin_permissions"
    ADD CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_product_recommendations"
    ADD CONSTRAINT "ai_product_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_search_queries"
    ADD CONSTRAINT "ai_search_queries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approvals"
    ADD CONSTRAINT "approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."automation_rules"
    ADD CONSTRAINT "automation_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_variant_id_key" UNIQUE ("cart_id", "variant_id");



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_code_prefix_unique" UNIQUE ("code_prefix");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_unique" UNIQUE ("slug");



ALTER TABLE ONLY "public"."cold_chain_logs"
    ADD CONSTRAINT "cold_chain_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cold_chain_rules"
    ADD CONSTRAINT "cold_chain_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupon_redemptions"
    ADD CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_addresses"
    ADD CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_credit_accounts"
    ADD CONSTRAINT "customer_credit_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_credit_accounts"
    ADD CONSTRAINT "customer_credit_accounts_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."customer_events"
    ADD CONSTRAINT "customer_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_ltv"
    ADD CONSTRAINT "customer_ltv_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."customer_metrics"
    ADD CONSTRAINT "customer_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_metrics"
    ADD CONSTRAINT "customer_metrics_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."customer_segment_members"
    ADD CONSTRAINT "customer_segment_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_segment_members"
    ADD CONSTRAINT "customer_segment_members_segment_id_user_id_key" UNIQUE ("segment_id", "user_id");



ALTER TABLE ONLY "public"."customer_segments"
    ADD CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_segments"
    ADD CONSTRAINT "customer_segments_segment_code_key" UNIQUE ("segment_code");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_customer_code_key" UNIQUE ("customer_code");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_tracking_code_key" UNIQUE ("tracking_code");



ALTER TABLE ONLY "public"."delivery_drivers"
    ADD CONSTRAINT "delivery_drivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_routes"
    ADD CONSTRAINT "delivery_routes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_routes"
    ADD CONSTRAINT "delivery_routes_route_code_key" UNIQUE ("route_code");



ALTER TABLE ONLY "public"."delivery_slots"
    ADD CONSTRAINT "delivery_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."delivery_status_history"
    ADD CONSTRAINT "delivery_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demand_forecasts"
    ADD CONSTRAINT "demand_forecasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."demand_forecasts"
    ADD CONSTRAINT "demand_forecasts_product_id_period_days_key" UNIQUE ("product_id", "period_days");



ALTER TABLE ONLY "public"."email_queue"
    ADD CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."families"
    ADD CONSTRAINT "families_internal_code_key" UNIQUE ("internal_code");



ALTER TABLE ONLY "public"."families"
    ADD CONSTRAINT "families_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."families"
    ADD CONSTRAINT "families_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."flavors"
    ADD CONSTRAINT "flavors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flavors"
    ADD CONSTRAINT "flavors_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."ingredients"
    ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_adjustments"
    ADD CONSTRAINT "inventory_adjustments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_batches"
    ADD CONSTRAINT "inventory_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_levels"
    ADD CONSTRAINT "inventory_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_levels"
    ADD CONSTRAINT "inventory_levels_warehouse_id_product_id_variant_id_key" UNIQUE ("warehouse_id", "product_id", "variant_id");



ALTER TABLE ONLY "public"."inventory_locations"
    ADD CONSTRAINT "inventory_locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_locations"
    ADD CONSTRAINT "inventory_locations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."inventory_lots"
    ADD CONSTRAINT "inventory_lots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_reservations"
    ADD CONSTRAINT "inventory_reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_snapshots_daily"
    ADD CONSTRAINT "inventory_snapshots_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inventory_snapshots_daily"
    ADD CONSTRAINT "inventory_snapshots_daily_snapshot_date_warehouse_id_produc_key" UNIQUE ("snapshot_date", "warehouse_id", "product_id", "variant_id");



ALTER TABLE ONLY "public"."inventory_snapshots"
    ADD CONSTRAINT "inventory_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoice_payments"
    ADD CONSTRAINT "invoice_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_invoice_number_key" UNIQUE ("invoice_number");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."live_order_status"
    ADD CONSTRAINT "live_order_status_pkey" PRIMARY KEY ("order_id");



ALTER TABLE ONLY "public"."low_stock_alerts"
    ADD CONSTRAINT "low_stock_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_shipments"
    ADD CONSTRAINT "order_shipments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_timeline"
    ADD CONSTRAINT "order_timeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_payment_id_key" UNIQUE ("payment_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_proofs"
    ADD CONSTRAINT "payment_proofs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_reconciliation"
    ADD CONSTRAINT "payment_reconciliation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_terms"
    ADD CONSTRAINT "payment_terms_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."payment_terms"
    ADD CONSTRAINT "payment_terms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_webhooks"
    ADD CONSTRAINT "payment_webhooks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."picking_order_items"
    ADD CONSTRAINT "picking_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."picking_orders"
    ADD CONSTRAINT "picking_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preparation_types"
    ADD CONSTRAINT "preparation_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."preparation_types"
    ADD CONSTRAINT "preparation_types_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pricing_rules"
    ADD CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_analytics_daily"
    ADD CONSTRAINT "product_analytics_daily_analytics_date_product_id_key" UNIQUE ("analytics_date", "product_id");



ALTER TABLE ONLY "public"."product_analytics_daily"
    ADD CONSTRAINT "product_analytics_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_badge_relations"
    ADD CONSTRAINT "product_badge_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_badge_relations"
    ADD CONSTRAINT "product_badge_relations_product_id_badge_id_key" UNIQUE ("product_id", "badge_id");



ALTER TABLE ONLY "public"."product_badges"
    ADD CONSTRAINT "product_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_badges"
    ADD CONSTRAINT "product_badges_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."product_embeddings"
    ADD CONSTRAINT "product_embeddings_pkey" PRIMARY KEY ("product_id");



ALTER TABLE ONLY "public"."product_families"
    ADD CONSTRAINT "product_families_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_families"
    ADD CONSTRAINT "product_families_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."product_forecasting"
    ADD CONSTRAINT "product_forecasting_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_nutrition"
    ADD CONSTRAINT "product_nutrition_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_nutrition"
    ADD CONSTRAINT "product_nutrition_product_id_key" UNIQUE ("product_id");



ALTER TABLE ONLY "public"."product_recommendations"
    ADD CONSTRAINT "product_recommendations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_seo"
    ADD CONSTRAINT "product_seo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_seo"
    ADD CONSTRAINT "product_seo_product_id_key" UNIQUE ("product_id");



ALTER TABLE ONLY "public"."product_tag_relations"
    ADD CONSTRAINT "product_tag_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_tag_relations"
    ADD CONSTRAINT "product_tag_relations_product_id_tag_id_key" UNIQUE ("product_id", "tag_id");



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_tags"
    ADD CONSTRAINT "product_tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_sku_key" UNIQUE ("sku");



ALTER TABLE ONLY "public"."production_consumptions"
    ADD CONSTRAINT "production_consumptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_costs"
    ADD CONSTRAINT "production_costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_costs"
    ADD CONSTRAINT "production_costs_production_order_id_key" UNIQUE ("production_order_id");



ALTER TABLE ONLY "public"."production_lines"
    ADD CONSTRAINT "production_lines_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_lot_consumptions"
    ADD CONSTRAINT "production_lot_consumptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_order_consumptions"
    ADD CONSTRAINT "production_order_consumptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_order_items"
    ADD CONSTRAINT "production_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_production_number_key" UNIQUE ("production_number");



ALTER TABLE ONLY "public"."production_outputs"
    ADD CONSTRAINT "production_outputs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_schedules"
    ADD CONSTRAINT "production_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."production_schedules"
    ADD CONSTRAINT "production_schedules_production_order_id_key" UNIQUE ("production_order_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_internal_code_key" UNIQUE ("internal_code");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proof_of_delivery"
    ADD CONSTRAINT "proof_of_delivery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_requisition_items"
    ADD CONSTRAINT "purchase_requisition_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_requisitions"
    ADD CONSTRAINT "purchase_requisitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_requisitions"
    ADD CONSTRAINT "purchase_requisitions_requisition_number_key" UNIQUE ("requisition_number");



ALTER TABLE ONLY "public"."raw_material_lots"
    ADD CONSTRAINT "raw_material_lots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."raw_materials"
    ADD CONSTRAINT "raw_materials_internal_code_key" UNIQUE ("internal_code");



ALTER TABLE ONLY "public"."raw_materials"
    ADD CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."raw_materials"
    ADD CONSTRAINT "raw_materials_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipe_items"
    ADD CONSTRAINT "recipe_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."refunds"
    ADD CONSTRAINT "refunds_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."related_products"
    ADD CONSTRAINT "related_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."related_products"
    ADD CONSTRAINT "related_products_product_id_related_product_id_key" UNIQUE ("product_id", "related_product_id");



ALTER TABLE ONLY "public"."sales_daily"
    ADD CONSTRAINT "sales_daily_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_daily"
    ADD CONSTRAINT "sales_daily_sales_date_key" UNIQUE ("sales_date");



ALTER TABLE ONLY "public"."sales_order_items"
    ADD CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_order_profit"
    ADD CONSTRAINT "sales_order_profit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_order_number_key" UNIQUE ("order_number");



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scheduled_jobs"
    ADD CONSTRAINT "scheduled_jobs_job_key_key" UNIQUE ("job_key");



ALTER TABLE ONLY "public"."scheduled_jobs"
    ADD CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_methods"
    ADD CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_methods"
    ADD CONSTRAINT "shipping_methods_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."shipping_rates"
    ADD CONSTRAINT "shipping_rates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shipping_zones"
    ADD CONSTRAINT "shipping_zones_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."shipping_zones"
    ADD CONSTRAINT "shipping_zones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenant_members"
    ADD CONSTRAINT "tenant_members_pkey" PRIMARY KEY ("tenant_id", "user_id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."units_of_measure"
    ADD CONSTRAINT "units_of_measure_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."units_of_measure"
    ADD CONSTRAINT "units_of_measure_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_admin_permissions"
    ADD CONSTRAINT "user_admin_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_admin_permissions"
    ADD CONSTRAINT "user_admin_permissions_user_id_permission_id_key" UNIQUE ("user_id", "permission_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."warehouses"
    ADD CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waste_tracking"
    ADD CONSTRAINT "waste_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."webhook_events"
    ADD CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."whatsapp_queue"
    ADD CONSTRAINT "whatsapp_queue_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_abandoned_carts_recovered" ON "public"."abandoned_carts" USING "btree" ("recovered");



CREATE INDEX "idx_abandoned_carts_user" ON "public"."abandoned_carts" USING "btree" ("user_id");



CREATE INDEX "idx_activity_logs_action" ON "public"."activity_logs" USING "btree" ("action");



CREATE INDEX "idx_activity_logs_created_at" ON "public"."activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activity_logs_user" ON "public"."activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_ai_product_recommendations_source" ON "public"."ai_product_recommendations" USING "btree" ("source_product_id");



CREATE INDEX "idx_ai_search_queries_user" ON "public"."ai_search_queries" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_events_created" ON "public"."analytics_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_analytics_events_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_events_user" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_approvals_reference" ON "public"."approvals" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_approvals_status" ON "public"."approvals" USING "btree" ("status");



CREATE INDEX "idx_approvals_type" ON "public"."approvals" USING "btree" ("approval_type");



CREATE INDEX "idx_ar_customer" ON "public"."accounts_receivable" USING "btree" ("customer_id");



CREATE INDEX "idx_ar_order" ON "public"."accounts_receivable" USING "btree" ("sales_order_id");



CREATE INDEX "idx_ar_payments_account" ON "public"."accounts_receivable_payments" USING "btree" ("account_receivable_id");



CREATE INDEX "idx_automation_rules_trigger" ON "public"."automation_rules" USING "btree" ("trigger_event");



CREATE INDEX "idx_cart_items_cart" ON "public"."cart_items" USING "btree" ("cart_id");



CREATE INDEX "idx_cart_items_variant" ON "public"."cart_items" USING "btree" ("variant_id");



CREATE INDEX "idx_carts_session" ON "public"."carts" USING "btree" ("session_id");



CREATE INDEX "idx_carts_status" ON "public"."carts" USING "btree" ("status");



CREATE INDEX "idx_carts_user" ON "public"."carts" USING "btree" ("user_id");



CREATE INDEX "idx_cold_chain_logs_delivery" ON "public"."cold_chain_logs" USING "btree" ("delivery_id");



CREATE INDEX "idx_coupon_redemptions_coupon" ON "public"."coupon_redemptions" USING "btree" ("coupon_id");



CREATE INDEX "idx_customer_addresses_user" ON "public"."customer_addresses" USING "btree" ("user_id");



CREATE INDEX "idx_customer_credit_accounts_user" ON "public"."customer_credit_accounts" USING "btree" ("user_id");



CREATE INDEX "idx_customer_events_created" ON "public"."customer_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_customer_events_type" ON "public"."customer_events" USING "btree" ("event_type");



CREATE INDEX "idx_customer_events_user" ON "public"."customer_events" USING "btree" ("user_id");



CREATE INDEX "idx_customer_segment_members_user" ON "public"."customer_segment_members" USING "btree" ("user_id");



CREATE INDEX "idx_customer_segments_code" ON "public"."customer_segments" USING "btree" ("segment_code");



CREATE INDEX "idx_customers_company" ON "public"."customers" USING "btree" ("company_name");



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_name" ON "public"."customers" USING "btree" ("name");



CREATE INDEX "idx_deliveries_driver" ON "public"."deliveries" USING "btree" ("driver_id");



CREATE INDEX "idx_deliveries_order" ON "public"."deliveries" USING "btree" ("order_id");



CREATE INDEX "idx_deliveries_status" ON "public"."deliveries" USING "btree" ("delivery_status");



CREATE INDEX "idx_deliveries_tracking" ON "public"."deliveries" USING "btree" ("tracking_code");



CREATE INDEX "idx_delivery_drivers_active" ON "public"."delivery_drivers" USING "btree" ("is_active");



CREATE INDEX "idx_delivery_routes_driver" ON "public"."delivery_routes" USING "btree" ("driver_id");



CREATE INDEX "idx_delivery_routes_status" ON "public"."delivery_routes" USING "btree" ("route_status");



CREATE INDEX "idx_delivery_slots_zone" ON "public"."delivery_slots" USING "btree" ("shipping_zone_id");



CREATE INDEX "idx_delivery_status_history_delivery" ON "public"."delivery_status_history" USING "btree" ("delivery_id");



CREATE INDEX "idx_demand_forecast_calculated" ON "public"."demand_forecasts" USING "btree" ("calculated_at");



CREATE INDEX "idx_demand_forecast_product" ON "public"."demand_forecasts" USING "btree" ("product_id");



CREATE INDEX "idx_email_queue_scheduled" ON "public"."email_queue" USING "btree" ("scheduled_for");



CREATE INDEX "idx_email_queue_status" ON "public"."email_queue" USING "btree" ("status");



CREATE INDEX "idx_ingredients_code" ON "public"."ingredients" USING "btree" ("code");



CREATE INDEX "idx_inventory_adjustments_variant" ON "public"."inventory_adjustments" USING "btree" ("product_variant_id");



CREATE INDEX "idx_inventory_batches_batch" ON "public"."inventory_batches" USING "btree" ("batch_number");



CREATE INDEX "idx_inventory_batches_expires" ON "public"."inventory_batches" USING "btree" ("expires_at");



CREATE INDEX "idx_inventory_batches_product" ON "public"."inventory_batches" USING "btree" ("product_id");



CREATE INDEX "idx_inventory_levels_product" ON "public"."inventory_levels" USING "btree" ("product_id");



CREATE INDEX "idx_inventory_levels_variant" ON "public"."inventory_levels" USING "btree" ("variant_id");



CREATE UNIQUE INDEX "idx_inventory_locations_slug" ON "public"."inventory_locations" USING "btree" ("slug");



CREATE INDEX "idx_inventory_locations_zone" ON "public"."inventory_locations" USING "btree" ("zone");



CREATE INDEX "idx_inventory_lots_expiration" ON "public"."inventory_lots" USING "btree" ("expiration_date");



CREATE INDEX "idx_inventory_lots_item" ON "public"."inventory_lots" USING "btree" ("item_type", "item_id");



CREATE INDEX "idx_inventory_movements_created" ON "public"."inventory_movements" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_inventory_movements_product" ON "public"."inventory_movements" USING "btree" ("product_id");



CREATE INDEX "idx_inventory_movements_variant" ON "public"."inventory_movements" USING "btree" ("variant_id");



CREATE INDEX "idx_inventory_reservation_item" ON "public"."inventory_reservations" USING "btree" ("item_type", "item_id");



CREATE INDEX "idx_inventory_reservation_reference" ON "public"."inventory_reservations" USING "btree" ("reference_type", "reference_id");



CREATE INDEX "idx_inventory_reservation_status" ON "public"."inventory_reservations" USING "btree" ("status");



CREATE INDEX "idx_inventory_snapshots_time" ON "public"."inventory_snapshots" USING "btree" ("snapshot_at" DESC);



CREATE INDEX "idx_inventory_snapshots_variant" ON "public"."inventory_snapshots" USING "btree" ("product_variant_id");



CREATE INDEX "idx_invoice_payments_invoice" ON "public"."invoice_payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_invoice_payments_transaction" ON "public"."invoice_payments" USING "btree" ("payment_transaction_id");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("due_date");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("invoice_status");



CREATE INDEX "idx_invoices_user" ON "public"."invoices" USING "btree" ("user_id");



CREATE INDEX "idx_live_order_status_updated" ON "public"."live_order_status" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_low_stock_alerts_resolved" ON "public"."low_stock_alerts" USING "btree" ("resolved");



CREATE INDEX "idx_notifications_read" ON "public"."notifications" USING "btree" ("read");



CREATE INDEX "idx_notifications_severity" ON "public"."notifications" USING "btree" ("severity");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_order_shipments_order" ON "public"."order_shipments" USING "btree" ("order_id");



CREATE INDEX "idx_order_status_history_order" ON "public"."order_status_history" USING "btree" ("order_id");



CREATE INDEX "idx_order_timeline_order" ON "public"."order_timeline" USING "btree" ("order_id");



CREATE INDEX "idx_payment_attempts_payment" ON "public"."payment_attempts" USING "btree" ("payment_id");



CREATE INDEX "idx_payment_events_created" ON "public"."payment_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payment_events_order" ON "public"."payment_events" USING "btree" ("order_id");



CREATE INDEX "idx_payment_events_processed" ON "public"."payment_events" USING "btree" ("processed");



CREATE INDEX "idx_payment_events_provider" ON "public"."payment_events" USING "btree" ("provider");



CREATE INDEX "idx_payment_events_transaction" ON "public"."payment_events" USING "btree" ("payment_transaction_id");



CREATE INDEX "idx_payment_events_type" ON "public"."payment_events" USING "btree" ("event_type");



CREATE INDEX "idx_payment_proofs_order" ON "public"."payment_proofs" USING "btree" ("order_id");



CREATE INDEX "idx_payment_proofs_status" ON "public"."payment_proofs" USING "btree" ("status");



CREATE INDEX "idx_payment_proofs_transaction" ON "public"."payment_proofs" USING "btree" ("payment_transaction_id");



CREATE INDEX "idx_payment_proofs_uploaded_by" ON "public"."payment_proofs" USING "btree" ("uploaded_by");



CREATE INDEX "idx_payment_reconciliation_order" ON "public"."payment_reconciliation" USING "btree" ("order_id");



CREATE INDEX "idx_payment_reconciliation_reference" ON "public"."payment_reconciliation" USING "btree" ("bank_reference");



CREATE INDEX "idx_payment_reconciliation_status" ON "public"."payment_reconciliation" USING "btree" ("reconciliation_status");



CREATE INDEX "idx_payment_reconciliation_transaction" ON "public"."payment_reconciliation" USING "btree" ("payment_transaction_id");



CREATE INDEX "idx_payment_terms_code" ON "public"."payment_terms" USING "btree" ("code");



CREATE INDEX "idx_payment_transactions_created" ON "public"."payment_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_payment_transactions_order" ON "public"."payment_transactions" USING "btree" ("order_id");



CREATE INDEX "idx_payment_transactions_provider" ON "public"."payment_transactions" USING "btree" ("provider");



CREATE INDEX "idx_payment_transactions_status" ON "public"."payment_transactions" USING "btree" ("status");



CREATE INDEX "idx_payment_transactions_user" ON "public"."payment_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_payment_webhooks_processed" ON "public"."payment_webhooks" USING "btree" ("processed");



CREATE INDEX "idx_payment_webhooks_provider" ON "public"."payment_webhooks" USING "btree" ("provider");



CREATE INDEX "idx_payments_order" ON "public"."payments" USING "btree" ("order_id");



CREATE INDEX "idx_payments_provider" ON "public"."payments" USING "btree" ("provider");



CREATE INDEX "idx_payments_status" ON "public"."payments" USING "btree" ("status");



CREATE INDEX "idx_picking_item_order" ON "public"."picking_order_items" USING "btree" ("picking_order_id");



CREATE INDEX "idx_picking_item_product" ON "public"."picking_order_items" USING "btree" ("product_id");



CREATE INDEX "idx_picking_sales_order" ON "public"."picking_orders" USING "btree" ("sales_order_id");



CREATE INDEX "idx_po_items_material" ON "public"."purchase_order_items" USING "btree" ("raw_material_id");



CREATE INDEX "idx_po_items_po" ON "public"."purchase_order_items" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_po_status" ON "public"."purchase_orders" USING "btree" ("status");



CREATE INDEX "idx_po_supplier" ON "public"."purchase_orders" USING "btree" ("supplier_id");



CREATE INDEX "idx_pr_status" ON "public"."purchase_requisitions" USING "btree" ("status");



CREATE INDEX "idx_pri_material" ON "public"."purchase_requisition_items" USING "btree" ("raw_material_id");



CREATE INDEX "idx_pri_pr" ON "public"."purchase_requisition_items" USING "btree" ("purchase_requisition_id");



CREATE INDEX "idx_price_history_variant" ON "public"."price_history" USING "btree" ("variant_id");



CREATE INDEX "idx_prod_lot_material" ON "public"."production_lot_consumptions" USING "btree" ("raw_material_id");



CREATE INDEX "idx_prod_lot_order" ON "public"."production_lot_consumptions" USING "btree" ("production_order_id");



CREATE INDEX "idx_product_analytics_date" ON "public"."product_analytics_daily" USING "btree" ("analytics_date" DESC);



CREATE INDEX "idx_product_analytics_product" ON "public"."product_analytics_daily" USING "btree" ("product_id");



CREATE INDEX "idx_product_badges_relations_product" ON "public"."product_badge_relations" USING "btree" ("product_id");



CREATE INDEX "idx_product_forecasting_date" ON "public"."product_forecasting" USING "btree" ("forecast_date");



CREATE INDEX "idx_product_forecasting_product" ON "public"."product_forecasting" USING "btree" ("product_id");



CREATE INDEX "idx_product_images_product" ON "public"."product_images" USING "btree" ("product_id");



CREATE INDEX "idx_product_recommendations_source" ON "public"."product_recommendations" USING "btree" ("source_product_id");



CREATE INDEX "idx_product_tag_relations_product" ON "public"."product_tag_relations" USING "btree" ("product_id");



CREATE INDEX "idx_product_tag_relations_tag" ON "public"."product_tag_relations" USING "btree" ("tag_id");



CREATE INDEX "idx_production_consumptions_order" ON "public"."production_consumptions" USING "btree" ("production_order_id");



CREATE INDEX "idx_production_cost_order" ON "public"."production_costs" USING "btree" ("production_order_id");



CREATE INDEX "idx_production_lot_consumption_lot" ON "public"."production_lot_consumptions" USING "btree" ("inventory_lot_id");



CREATE INDEX "idx_production_lot_consumption_order" ON "public"."production_lot_consumptions" USING "btree" ("production_order_id");



CREATE INDEX "idx_production_order_consumptions_item_id" ON "public"."production_order_consumptions" USING "btree" ("production_order_item_id");



CREATE INDEX "idx_production_order_consumptions_lot_id" ON "public"."production_order_consumptions" USING "btree" ("raw_material_lot_id");



CREATE INDEX "idx_production_order_items_order_id" ON "public"."production_order_items" USING "btree" ("production_order_id");



CREATE INDEX "idx_production_order_items_raw_material_id" ON "public"."production_order_items" USING "btree" ("raw_material_id");



CREATE INDEX "idx_production_orders_recipe" ON "public"."production_orders" USING "btree" ("recipe_id");



CREATE INDEX "idx_production_orders_status" ON "public"."production_orders" USING "btree" ("production_status");



CREATE INDEX "idx_production_outputs_order" ON "public"."production_outputs" USING "btree" ("production_order_id");



CREATE INDEX "idx_production_schedule_date" ON "public"."production_schedules" USING "btree" ("scheduled_date");



CREATE INDEX "idx_production_schedule_line" ON "public"."production_schedules" USING "btree" ("production_line");



CREATE INDEX "idx_production_schedule_status" ON "public"."production_schedules" USING "btree" ("status");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_products_family" ON "public"."products" USING "btree" ("family_id");



CREATE INDEX "idx_products_flavor" ON "public"."products" USING "btree" ("flavor_id");



CREATE INDEX "idx_products_preparation" ON "public"."products" USING "btree" ("preparation_type_id");



CREATE INDEX "idx_products_slug" ON "public"."products" USING "btree" ("slug");



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status");



CREATE INDEX "idx_proof_of_delivery_delivery" ON "public"."proof_of_delivery" USING "btree" ("delivery_id");



CREATE INDEX "idx_raw_material_supplier" ON "public"."raw_materials" USING "btree" ("preferred_supplier_id");



CREATE INDEX "idx_raw_materials_active" ON "public"."raw_materials" USING "btree" ("is_active");



CREATE INDEX "idx_raw_materials_category" ON "public"."raw_materials" USING "btree" ("category_id");



CREATE INDEX "idx_raw_materials_deleted" ON "public"."raw_materials" USING "btree" ("deleted_at");



CREATE INDEX "idx_raw_materials_family" ON "public"."raw_materials" USING "btree" ("family_id");



CREATE INDEX "idx_raw_materials_unit" ON "public"."raw_materials" USING "btree" ("unit_of_measure_id");



CREATE INDEX "idx_recipe_ingredients_ingredient" ON "public"."recipe_ingredients" USING "btree" ("ingredient_id");



CREATE INDEX "idx_recipe_ingredients_recipe" ON "public"."recipe_ingredients" USING "btree" ("recipe_id");



CREATE INDEX "idx_recipe_items_material" ON "public"."recipe_items" USING "btree" ("raw_material_id");



CREATE INDEX "idx_recipe_items_recipe" ON "public"."recipe_items" USING "btree" ("recipe_id");



CREATE INDEX "idx_recipe_product" ON "public"."recipes" USING "btree" ("product_id");



CREATE INDEX "idx_refunds_payment" ON "public"."refunds" USING "btree" ("payment_id");



CREATE INDEX "idx_related_products_product" ON "public"."related_products" USING "btree" ("product_id");



CREATE INDEX "idx_sales_order_item_order" ON "public"."sales_order_items" USING "btree" ("sales_order_id");



CREATE INDEX "idx_sales_order_item_product" ON "public"."sales_order_items" USING "btree" ("product_id");



CREATE INDEX "idx_sales_order_items_order" ON "public"."sales_order_items" USING "btree" ("sales_order_id");



CREATE INDEX "idx_sales_order_items_product" ON "public"."sales_order_items" USING "btree" ("product_id");



CREATE INDEX "idx_sales_orders_customer" ON "public"."sales_orders" USING "btree" ("customer_id");



CREATE INDEX "idx_sales_profit_order" ON "public"."sales_order_profit" USING "btree" ("sales_order_id");



CREATE INDEX "idx_scheduled_jobs_active" ON "public"."scheduled_jobs" USING "btree" ("is_active");



CREATE INDEX "idx_shipping_methods_slug" ON "public"."shipping_methods" USING "btree" ("slug");



CREATE INDEX "idx_shipping_rates_method" ON "public"."shipping_rates" USING "btree" ("method_id");



CREATE INDEX "idx_shipping_rates_zone" ON "public"."shipping_rates" USING "btree" ("zone_id");



CREATE INDEX "idx_shipping_zones_code" ON "public"."shipping_zones" USING "btree" ("code");



CREATE INDEX "idx_stock_alerts_resolved" ON "public"."stock_alerts" USING "btree" ("resolved");



CREATE INDEX "idx_stock_reservations_product" ON "public"."stock_reservations" USING "btree" ("product_id");



CREATE INDEX "idx_stock_reservations_status" ON "public"."stock_reservations" USING "btree" ("reservation_status");



CREATE INDEX "idx_suppliers_deleted" ON "public"."suppliers" USING "btree" ("deleted_at");



CREATE INDEX "idx_suppliers_name" ON "public"."suppliers" USING "btree" ("name");



CREATE INDEX "idx_suppliers_tax_id" ON "public"."suppliers" USING "btree" ("tax_id");



CREATE INDEX "idx_user_admin_permissions_user" ON "public"."user_admin_permissions" USING "btree" ("user_id");



CREATE INDEX "idx_variants_customer_type" ON "public"."product_variants" USING "btree" ("customer_type");



CREATE INDEX "idx_variants_product" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "idx_warehouses_code" ON "public"."warehouses" USING "btree" ("code");



CREATE INDEX "idx_waste_tracking_created" ON "public"."waste_tracking" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_webhook_events_processed" ON "public"."webhook_events" USING "btree" ("processed");



CREATE INDEX "idx_webhook_events_provider" ON "public"."webhook_events" USING "btree" ("provider");



CREATE INDEX "idx_whatsapp_queue_status" ON "public"."whatsapp_queue" USING "btree" ("status");



CREATE UNIQUE INDEX "uq_payment_provider_event" ON "public"."payment_events" USING "btree" ("provider", "provider_event_id") WHERE ("provider_event_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "trg_cart_items_updated_at" BEFORE UPDATE ON "public"."cart_items" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_carts_updated_at" BEFORE UPDATE ON "public"."carts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_customer_addresses_updated_at" BEFORE UPDATE ON "public"."customer_addresses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_customer_credit_accounts_updated_at" BEFORE UPDATE ON "public"."customer_credit_accounts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_deliveries_updated_at" BEFORE UPDATE ON "public"."deliveries" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_delivery_drivers_updated_at" BEFORE UPDATE ON "public"."delivery_drivers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_delivery_routes_updated_at" BEFORE UPDATE ON "public"."delivery_routes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_generate_invoice_number" BEFORE INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."generate_invoice_number"();



CREATE OR REPLACE TRIGGER "trg_ingredients_updated_at" BEFORE UPDATE ON "public"."ingredients" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_inventory_levels_updated_at" BEFORE UPDATE ON "public"."inventory_levels" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_invoices_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_log_order_status_change" AFTER UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."log_order_status_change"();



CREATE OR REPLACE TRIGGER "trg_order_shipments_updated_at" BEFORE UPDATE ON "public"."order_shipments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payment_proofs_updated_at" BEFORE UPDATE ON "public"."payment_proofs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payment_reconciliation_updated_at" BEFORE UPDATE ON "public"."payment_reconciliation" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payment_transactions_updated_at" BEFORE UPDATE ON "public"."payment_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_payments_updated_at" BEFORE UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_production_orders_updated_at" BEFORE UPDATE ON "public"."production_orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_recalculate_cart_totals_delete" AFTER DELETE ON "public"."cart_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_cart_totals"();



CREATE OR REPLACE TRIGGER "trg_recalculate_cart_totals_insert" AFTER INSERT ON "public"."cart_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_cart_totals"();



CREATE OR REPLACE TRIGGER "trg_recalculate_cart_totals_update" AFTER UPDATE ON "public"."cart_items" FOR EACH ROW EXECUTE FUNCTION "public"."recalculate_cart_totals"();



CREATE OR REPLACE TRIGGER "trg_shipping_zones_updated_at" BEFORE UPDATE ON "public"."shipping_zones" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_sync_order_payment_status" AFTER INSERT OR UPDATE ON "public"."payments" FOR EACH ROW EXECUTE FUNCTION "public"."sync_order_payment_status"();



CREATE OR REPLACE TRIGGER "trg_warehouses_updated_at" BEFORE UPDATE ON "public"."warehouses" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_orders_time" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_order_timestamp"();



ALTER TABLE ONLY "public"."abandoned_carts"
    ADD CONSTRAINT "abandoned_carts_recovered_order_id_fkey" FOREIGN KEY ("recovered_order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."abandoned_carts"
    ADD CONSTRAINT "abandoned_carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."accounts_receivable_payments"
    ADD CONSTRAINT "accounts_receivable_payments_account_receivable_id_fkey" FOREIGN KEY ("account_receivable_id") REFERENCES "public"."accounts_receivable"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."accounts_receivable"
    ADD CONSTRAINT "accounts_receivable_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id");



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_product_recommendations"
    ADD CONSTRAINT "ai_product_recommendations_recommended_product_id_fkey" FOREIGN KEY ("recommended_product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ai_product_recommendations"
    ADD CONSTRAINT "ai_product_recommendations_source_product_id_fkey" FOREIGN KEY ("source_product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cart_items"
    ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."carts"
    ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cold_chain_logs"
    ADD CONSTRAINT "cold_chain_logs_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."cold_chain_logs"
    ADD CONSTRAINT "cold_chain_logs_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "public"."delivery_routes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_redemptions"
    ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_redemptions"
    ADD CONSTRAINT "coupon_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."coupon_redemptions"
    ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_addresses"
    ADD CONSTRAINT "customer_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_credit_accounts"
    ADD CONSTRAINT "customer_credit_accounts_payment_term_id_fkey" FOREIGN KEY ("payment_term_id") REFERENCES "public"."payment_terms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_events"
    ADD CONSTRAINT "customer_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_metrics"
    ADD CONSTRAINT "customer_metrics_favorite_category_id_fkey" FOREIGN KEY ("favorite_category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_metrics"
    ADD CONSTRAINT "customer_metrics_favorite_product_id_fkey" FOREIGN KEY ("favorite_product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."customer_metrics"
    ADD CONSTRAINT "customer_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_segment_members"
    ADD CONSTRAINT "customer_segment_members_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."customer_segments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."delivery_drivers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "public"."delivery_routes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_shipping_zone_id_fkey" FOREIGN KEY ("shipping_zone_id") REFERENCES "public"."shipping_zones"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."deliveries"
    ADD CONSTRAINT "deliveries_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."delivery_routes"
    ADD CONSTRAINT "delivery_routes_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."delivery_drivers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."delivery_routes"
    ADD CONSTRAINT "delivery_routes_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."delivery_status_history"
    ADD CONSTRAINT "delivery_status_history_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."demand_forecasts"
    ADD CONSTRAINT "demand_forecasts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."families"
    ADD CONSTRAINT "families_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."inventory_adjustments"
    ADD CONSTRAINT "inventory_adjustments_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_adjustments"
    ADD CONSTRAINT "inventory_adjustments_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_batches"
    ADD CONSTRAINT "inventory_batches_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_batches"
    ADD CONSTRAINT "inventory_batches_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_batches"
    ADD CONSTRAINT "inventory_batches_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_levels"
    ADD CONSTRAINT "inventory_levels_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_levels"
    ADD CONSTRAINT "inventory_levels_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_levels"
    ADD CONSTRAINT "inventory_levels_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_lots"
    ADD CONSTRAINT "inventory_lots_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id");



ALTER TABLE ONLY "public"."inventory_lots"
    ADD CONSTRAINT "inventory_lots_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_movements"
    ADD CONSTRAINT "inventory_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."inventory_snapshots_daily"
    ADD CONSTRAINT "inventory_snapshots_daily_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_snapshots_daily"
    ADD CONSTRAINT "inventory_snapshots_daily_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_snapshots_daily"
    ADD CONSTRAINT "inventory_snapshots_daily_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."inventory_snapshots"
    ADD CONSTRAINT "inventory_snapshots_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_payments"
    ADD CONSTRAINT "invoice_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoice_payments"
    ADD CONSTRAINT "invoice_payments_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_payment_term_id_fkey" FOREIGN KEY ("payment_term_id") REFERENCES "public"."payment_terms"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."live_order_status"
    ADD CONSTRAINT "live_order_status_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."low_stock_alerts"
    ADD CONSTRAINT "low_stock_alerts_inventory_level_id_fkey" FOREIGN KEY ("inventory_level_id") REFERENCES "public"."inventory_levels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_shipments"
    ADD CONSTRAINT "order_shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_shipments"
    ADD CONSTRAINT "order_shipments_shipping_method_id_fkey" FOREIGN KEY ("shipping_method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_status_history"
    ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_timeline"
    ADD CONSTRAINT "order_timeline_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."order_timeline"
    ADD CONSTRAINT "order_timeline_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_attempts"
    ADD CONSTRAINT "payment_attempts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_events"
    ADD CONSTRAINT "payment_events_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_proofs"
    ADD CONSTRAINT "payment_proofs_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_proofs"
    ADD CONSTRAINT "payment_proofs_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_reconciliation"
    ADD CONSTRAINT "payment_reconciliation_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_reconciliation"
    ADD CONSTRAINT "payment_reconciliation_payment_transaction_id_fkey" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."payment_transactions"
    ADD CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."picking_order_items"
    ADD CONSTRAINT "picking_order_items_inventory_location_id_fkey" FOREIGN KEY ("inventory_location_id") REFERENCES "public"."inventory_locations"("id");



ALTER TABLE ONLY "public"."picking_order_items"
    ADD CONSTRAINT "picking_order_items_picking_order_id_fkey" FOREIGN KEY ("picking_order_id") REFERENCES "public"."picking_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."picking_order_items"
    ADD CONSTRAINT "picking_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."picking_order_items"
    ADD CONSTRAINT "picking_order_items_product_lot_id_fkey" FOREIGN KEY ("product_lot_id") REFERENCES "public"."product_lots"("id");



ALTER TABLE ONLY "public"."picking_orders"
    ADD CONSTRAINT "picking_orders_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."price_history"
    ADD CONSTRAINT "price_history_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_analytics_daily"
    ADD CONSTRAINT "product_analytics_daily_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_badge_relations"
    ADD CONSTRAINT "product_badge_relations_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."product_badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_badge_relations"
    ADD CONSTRAINT "product_badge_relations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_embeddings"
    ADD CONSTRAINT "product_embeddings_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_forecasting"
    ADD CONSTRAINT "product_forecasting_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_forecasting"
    ADD CONSTRAINT "product_forecasting_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_inventory_location_id_fkey" FOREIGN KEY ("inventory_location_id") REFERENCES "public"."inventory_locations"("id");



ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."product_lots"
    ADD CONSTRAINT "product_lots_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id");



ALTER TABLE ONLY "public"."product_nutrition"
    ADD CONSTRAINT "product_nutrition_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_recommendations"
    ADD CONSTRAINT "product_recommendations_recommended_product_id_fkey" FOREIGN KEY ("recommended_product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_recommendations"
    ADD CONSTRAINT "product_recommendations_source_product_id_fkey" FOREIGN KEY ("source_product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_seo"
    ADD CONSTRAINT "product_seo_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_tag_relations"
    ADD CONSTRAINT "product_tag_relations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_tag_relations"
    ADD CONSTRAINT "product_tag_relations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."product_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."production_consumptions"
    ADD CONSTRAINT "production_consumptions_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."production_consumptions"
    ADD CONSTRAINT "production_consumptions_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."production_costs"
    ADD CONSTRAINT "production_costs_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id");



ALTER TABLE ONLY "public"."production_lot_consumptions"
    ADD CONSTRAINT "production_lot_consumptions_inventory_lot_id_fkey" FOREIGN KEY ("inventory_lot_id") REFERENCES "public"."inventory_lots"("id");



ALTER TABLE ONLY "public"."production_lot_consumptions"
    ADD CONSTRAINT "production_lot_consumptions_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."production_lot_consumptions"
    ADD CONSTRAINT "production_lot_consumptions_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id");



ALTER TABLE ONLY "public"."production_order_consumptions"
    ADD CONSTRAINT "production_order_consumptions_production_order_item_id_fkey" FOREIGN KEY ("production_order_item_id") REFERENCES "public"."production_order_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."production_order_consumptions"
    ADD CONSTRAINT "production_order_consumptions_raw_material_lot_id_fkey" FOREIGN KEY ("raw_material_lot_id") REFERENCES "public"."raw_material_lots"("id");



ALTER TABLE ONLY "public"."production_order_items"
    ADD CONSTRAINT "production_order_items_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."production_order_items"
    ADD CONSTRAINT "production_order_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id");



ALTER TABLE ONLY "public"."production_orders"
    ADD CONSTRAINT "production_orders_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_outputs"
    ADD CONSTRAINT "production_outputs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."inventory_batches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_outputs"
    ADD CONSTRAINT "production_outputs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."production_outputs"
    ADD CONSTRAINT "production_outputs_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."production_outputs"
    ADD CONSTRAINT "production_outputs_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."production_schedules"
    ADD CONSTRAINT "production_schedules_production_order_id_fkey" FOREIGN KEY ("production_order_id") REFERENCES "public"."production_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."product_families"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_flavor_id_fkey" FOREIGN KEY ("flavor_id") REFERENCES "public"."flavors"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_preparation_type_id_fkey" FOREIGN KEY ("preparation_type_id") REFERENCES "public"."preparation_types"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_unit_of_measure_id_fkey" FOREIGN KEY ("unit_of_measure_id") REFERENCES "public"."units_of_measure"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proof_of_delivery"
    ADD CONSTRAINT "proof_of_delivery_delivery_id_fkey" FOREIGN KEY ("delivery_id") REFERENCES "public"."deliveries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_order_items"
    ADD CONSTRAINT "purchase_order_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."purchase_requisition_items"
    ADD CONSTRAINT "purchase_requisition_items_purchase_requisition_id_fkey" FOREIGN KEY ("purchase_requisition_id") REFERENCES "public"."purchase_requisitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_requisition_items"
    ADD CONSTRAINT "purchase_requisition_items_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id");



ALTER TABLE ONLY "public"."raw_material_lots"
    ADD CONSTRAINT "raw_material_lots_inventory_location_id_fkey" FOREIGN KEY ("inventory_location_id") REFERENCES "public"."inventory_locations"("id");



ALTER TABLE ONLY "public"."raw_material_lots"
    ADD CONSTRAINT "raw_material_lots_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id");



ALTER TABLE ONLY "public"."raw_materials"
    ADD CONSTRAINT "raw_materials_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id");



ALTER TABLE ONLY "public"."raw_materials"
    ADD CONSTRAINT "raw_materials_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id");



ALTER TABLE ONLY "public"."raw_materials"
    ADD CONSTRAINT "raw_materials_preferred_supplier_id_fkey" FOREIGN KEY ("preferred_supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."raw_materials"
    ADD CONSTRAINT "raw_materials_unit_of_measure_id_fkey" FOREIGN KEY ("unit_of_measure_id") REFERENCES "public"."units_of_measure"("id");



ALTER TABLE ONLY "public"."recipe_ingredients"
    ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipe_items"
    ADD CONSTRAINT "recipe_items_ingredient_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "public"."raw_materials"("id");



ALTER TABLE ONLY "public"."recipe_items"
    ADD CONSTRAINT "recipe_items_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_unit_of_measure_id_fkey" FOREIGN KEY ("unit_of_measure_id") REFERENCES "public"."units_of_measure"("id");



ALTER TABLE ONLY "public"."refunds"
    ADD CONSTRAINT "refunds_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."refunds"
    ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."related_products"
    ADD CONSTRAINT "related_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."related_products"
    ADD CONSTRAINT "related_products_related_product_id_fkey" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_items"
    ADD CONSTRAINT "sales_order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."sales_order_items"
    ADD CONSTRAINT "sales_order_items_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_order_profit"
    ADD CONSTRAINT "sales_order_profit_sales_order_id_fkey" FOREIGN KEY ("sales_order_id") REFERENCES "public"."sales_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sales_orders"
    ADD CONSTRAINT "sales_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."shipping_rates"
    ADD CONSTRAINT "shipping_rates_method_id_fkey" FOREIGN KEY ("method_id") REFERENCES "public"."shipping_methods"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_alerts"
    ADD CONSTRAINT "stock_alerts_product_variant_id_fkey" FOREIGN KEY ("product_variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."tenant_members"
    ADD CONSTRAINT "tenant_members_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenant_members"
    ADD CONSTRAINT "tenant_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_admin_permissions"
    ADD CONSTRAINT "user_admin_permissions_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_admin_permissions"
    ADD CONSTRAINT "user_admin_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "public"."admin_permissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_admin_permissions"
    ADD CONSTRAINT "user_admin_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."waste_tracking"
    ADD CONSTRAINT "waste_tracking_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "public"."ingredients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."waste_tracking"
    ADD CONSTRAINT "waste_tracking_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."waste_tracking"
    ADD CONSTRAINT "waste_tracking_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE SET NULL;



CREATE POLICY "Allow authenticated delete" ON "public"."families" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated inserts" ON "public"."families" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated select" ON "public"."families" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated update" ON "public"."families" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow read units" ON "public"."units_of_measure" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own order items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."abandoned_carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."accounts_receivable" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accounts_receivable_insert" ON "public"."accounts_receivable" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."accounts_receivable_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "accounts_receivable_select" ON "public"."accounts_receivable" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "accounts_receivable_update" ON "public"."accounts_receivable" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_all_abandoned_carts" ON "public"."abandoned_carts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_activity_logs" ON "public"."activity_logs" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_analytics_events" ON "public"."analytics_events" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_automation_rules" ON "public"."automation_rules" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_cart_items" ON "public"."cart_items" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_carts" ON "public"."carts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_categories" ON "public"."categories" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_cold_chain_rules" ON "public"."cold_chain_rules" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_coupon_redemptions" ON "public"."coupon_redemptions" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_coupons" ON "public"."coupons" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_credit_accounts" ON "public"."customer_credit_accounts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_customer_events" ON "public"."customer_events" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_customer_metrics" ON "public"."customer_metrics" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_delivery_slots" ON "public"."delivery_slots" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_email_queue" ON "public"."email_queue" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_flavors" ON "public"."flavors" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_ingredients" ON "public"."ingredients" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_inventory_adjustments" ON "public"."inventory_adjustments" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_inventory_batches" ON "public"."inventory_batches" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_inventory_levels" ON "public"."inventory_levels" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "admin_all_inventory_movements" ON "public"."inventory_movements" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_inventory_snapshots" ON "public"."inventory_snapshots" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_inventory_snapshots_daily" ON "public"."inventory_snapshots_daily" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_invoice_payments" ON "public"."invoice_payments" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_invoices" ON "public"."invoices" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_live_order_status" ON "public"."live_order_status" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_low_stock_alerts" ON "public"."low_stock_alerts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_notifications" ON "public"."notifications" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_order_history" ON "public"."order_status_history" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_order_items" ON "public"."order_items" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_order_shipments" ON "public"."order_shipments" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_order_timeline" ON "public"."order_timeline" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_orders" ON "public"."orders" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_payment_attempts" ON "public"."payment_attempts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_payment_terms" ON "public"."payment_terms" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_payment_webhooks" ON "public"."payment_webhooks" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_payments" ON "public"."payments" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_permissions" ON "public"."admin_permissions" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_preparation_types" ON "public"."preparation_types" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_price_history" ON "public"."price_history" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_pricing_rules" ON "public"."pricing_rules" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_analytics_daily" ON "public"."product_analytics_daily" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_badge_relations" ON "public"."product_badge_relations" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_badges" ON "public"."product_badges" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_embeddings" ON "public"."product_embeddings" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_families" ON "public"."product_families" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_images" ON "public"."product_images" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_nutrition" ON "public"."product_nutrition" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_seo" ON "public"."product_seo" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_tag_relations" ON "public"."product_tag_relations" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_tags" ON "public"."product_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_product_variants" ON "public"."product_variants" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_production_consumptions" ON "public"."production_consumptions" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_production_orders" ON "public"."production_orders" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_production_outputs" ON "public"."production_outputs" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_products" ON "public"."products" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_recipe_ingredients" ON "public"."recipe_ingredients" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_refunds" ON "public"."refunds" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_related_products" ON "public"."related_products" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_sales_daily" ON "public"."sales_daily" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_shipping_methods" ON "public"."shipping_methods" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_shipping_rates" ON "public"."shipping_rates" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_stock_alerts" ON "public"."stock_alerts" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_stock_reservations" ON "public"."stock_reservations" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_user_permissions" ON "public"."user_admin_permissions" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_user_roles" ON "public"."user_roles" USING ("public"."is_admin"("auth"."uid"()));



CREATE POLICY "admin_all_warehouses" ON "public"."warehouses" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_waste_tracking" ON "public"."waste_tracking" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_webhook_events" ON "public"."webhook_events" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



CREATE POLICY "admin_all_whatsapp_queue" ON "public"."whatsapp_queue" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "ur"
  WHERE (("ur"."user_id" = "auth"."uid"()) AND ("ur"."role" = 'admin'::"text")))));



ALTER TABLE "public"."admin_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_product_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_search_queries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approvals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "ar_payments_insert" ON "public"."accounts_receivable_payments" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "ar_payments_select" ON "public"."accounts_receivable_payments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "ar_payments_update" ON "public"."accounts_receivable_payments" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_can_manage_categories" ON "public"."categories" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_can_read_categories" ON "public"."categories" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."automation_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cart_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cold_chain_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."cold_chain_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupon_redemptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_addresses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_credit_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_ltv" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_segment_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customer_segments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "customers_insert" ON "public"."customers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "customers_select" ON "public"."customers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "customers_update" ON "public"."customers" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_drivers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_routes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."demand_forecasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."families" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flavors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_adjustments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_batches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_locations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventory_locations_delete" ON "public"."inventory_locations" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "inventory_locations_insert" ON "public"."inventory_locations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "inventory_locations_select" ON "public"."inventory_locations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "inventory_locations_update" ON "public"."inventory_locations" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventory_lots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_movements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventory_movements_delete" ON "public"."inventory_movements" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "inventory_movements_insert" ON "public"."inventory_movements" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "inventory_movements_select" ON "public"."inventory_movements" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "inventory_movements_update" ON "public"."inventory_movements" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventory_reservations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "inventory_reservations_insert" ON "public"."inventory_reservations" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "inventory_reservations_select" ON "public"."inventory_reservations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "inventory_reservations_update" ON "public"."inventory_reservations" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."inventory_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inventory_snapshots_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoice_payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."live_order_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."low_stock_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_shipments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_status_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_timeline" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_proofs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_reconciliation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_terms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_webhooks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."picking_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."picking_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."preparation_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."price_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pricing_rules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_analytics_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_badge_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_badges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_embeddings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_families" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_forecasting" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_lots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_nutrition" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_recommendations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_seo" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_tag_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_consumptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_costs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_lines" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_lot_consumptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_order_consumptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "production_orders_delete" ON "public"."production_orders" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "production_orders_insert" ON "public"."production_orders" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "production_orders_select" ON "public"."production_orders" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "production_orders_update" ON "public"."production_orders" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."production_outputs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."production_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."proof_of_delivery" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public_read_active_coupons" ON "public"."coupons" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_read_categories" ON "public"."categories" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_read_cold_chain_rules" ON "public"."cold_chain_rules" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_read_delivery_slots" ON "public"."delivery_slots" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_read_flavors" ON "public"."flavors" FOR SELECT USING (true);



CREATE POLICY "public_read_payment_terms" ON "public"."payment_terms" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_read_preparation_types" ON "public"."preparation_types" FOR SELECT USING (true);



CREATE POLICY "public_read_pricing_rules" ON "public"."pricing_rules" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_read_product_badge_relations" ON "public"."product_badge_relations" FOR SELECT USING (true);



CREATE POLICY "public_read_product_badges" ON "public"."product_badges" FOR SELECT USING (true);



CREATE POLICY "public_read_product_families" ON "public"."product_families" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_read_product_images" ON "public"."product_images" FOR SELECT USING (true);



CREATE POLICY "public_read_product_nutrition" ON "public"."product_nutrition" FOR SELECT USING (true);



CREATE POLICY "public_read_product_recommendations" ON "public"."product_recommendations" FOR SELECT USING (true);



CREATE POLICY "public_read_product_seo" ON "public"."product_seo" FOR SELECT USING (true);



CREATE POLICY "public_read_product_tag_relations" ON "public"."product_tag_relations" FOR SELECT USING (true);



CREATE POLICY "public_read_product_tags" ON "public"."product_tags" FOR SELECT USING (true);



CREATE POLICY "public_read_product_variants" ON "public"."product_variants" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_read_products" ON "public"."products" FOR SELECT USING ((("status" = 'active'::"text") AND ("deleted_at" IS NULL)));



CREATE POLICY "public_read_related_products" ON "public"."related_products" FOR SELECT USING (true);



CREATE POLICY "public_read_shipping_methods" ON "public"."shipping_methods" FOR SELECT USING (("is_active" = true));



CREATE POLICY "public_read_shipping_rates" ON "public"."shipping_rates" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."purchase_order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_requisition_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_requisitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."raw_material_lots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."raw_materials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "raw_materials_delete" ON "public"."raw_materials" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "raw_materials_insert" ON "public"."raw_materials" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "raw_materials_select" ON "public"."raw_materials" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "raw_materials_update" ON "public"."raw_materials" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."recipe_ingredients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."recipe_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recipe_items_delete" ON "public"."recipe_items" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "recipe_items_insert" ON "public"."recipe_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "recipe_items_select" ON "public"."recipe_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "recipe_items_update" ON "public"."recipe_items" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recipes_delete" ON "public"."recipes" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "recipes_insert" ON "public"."recipes" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "recipes_select" ON "public"."recipes" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "recipes_update" ON "public"."recipes" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."refunds" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."related_products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_daily" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_order_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sales_order_items_insert" ON "public"."sales_order_items" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "sales_order_items_select" ON "public"."sales_order_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "sales_order_items_update" ON "public"."sales_order_items" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."sales_order_profit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales_orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sales_orders_insert" ON "public"."sales_orders" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "sales_orders_select" ON "public"."sales_orders" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "sales_orders_update" ON "public"."sales_orders" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "sales_profit_insert" ON "public"."sales_order_profit" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "sales_profit_select" ON "public"."sales_order_profit" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "sales_profit_update" ON "public"."sales_order_profit" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."scheduled_jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipping_methods" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipping_rates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shipping_zones" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suppliers_insert" ON "public"."suppliers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "suppliers_select" ON "public"."suppliers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "suppliers_update" ON "public"."suppliers" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."tenant_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenant_members_select_own" ON "public"."tenant_members" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tenants_delete_owner" ON "public"."tenants" FOR DELETE USING (("auth"."uid"() = "owner_id"));



CREATE POLICY "tenants_insert_owner" ON "public"."tenants" FOR INSERT WITH CHECK (("auth"."uid"() = "owner_id"));



CREATE POLICY "tenants_select_member" ON "public"."tenants" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members" "tm"
  WHERE (("tm"."tenant_id" = "tenants"."id") AND ("tm"."user_id" = "auth"."uid"())))));



CREATE POLICY "tenants_update_owner" ON "public"."tenants" FOR UPDATE USING (("auth"."uid"() = "owner_id")) WITH CHECK (("auth"."uid"() = "owner_id"));



ALTER TABLE "public"."units_of_measure" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "units_of_measure_delete" ON "public"."units_of_measure" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "units_of_measure_insert" ON "public"."units_of_measure" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "units_of_measure_select" ON "public"."units_of_measure" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "units_of_measure_update" ON "public"."units_of_measure" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."user_admin_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_read_own_roles" ON "public"."user_roles" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_insert_own_events" ON "public"."customer_events" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "users_manage_own_addresses" ON "public"."customer_addresses" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_manage_own_cart_items" ON "public"."cart_items" USING ((EXISTS ( SELECT 1
   FROM "public"."carts" "c"
  WHERE (("c"."id" = "cart_items"."cart_id") AND ("c"."user_id" = "auth"."uid"())))));



CREATE POLICY "users_manage_own_carts" ON "public"."carts" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_update_own_notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_view_own_abandoned_carts" ON "public"."abandoned_carts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_view_own_credit_accounts" ON "public"."customer_credit_accounts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_view_own_customer_metrics" ON "public"."customer_metrics" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_view_own_events" ON "public"."customer_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_view_own_invoice_payments" ON "public"."invoice_payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."invoices" "i"
  WHERE (("i"."id" = "invoice_payments"."invoice_id") AND ("i"."user_id" = "auth"."uid"())))));



CREATE POLICY "users_view_own_invoices" ON "public"."invoices" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_view_own_live_orders" ON "public"."live_order_status" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "live_order_status"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "users_view_own_notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_view_own_order_history" ON "public"."order_status_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_status_history"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "users_view_own_order_items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_items"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "users_view_own_order_timeline" ON "public"."order_timeline" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_timeline"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "users_view_own_orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "users_view_own_payments" ON "public"."payments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "payments"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



CREATE POLICY "users_view_own_shipments" ON "public"."order_shipments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders" "o"
  WHERE (("o"."id" = "order_shipments"."order_id") AND ("o"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."warehouses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "warehouses_delete" ON "public"."warehouses" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "warehouses_insert" ON "public"."warehouses" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "warehouses_select" ON "public"."warehouses" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "warehouses_update" ON "public"."warehouses" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."waste_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."webhook_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."whatsapp_queue" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_production_order_items"("p_production_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_production_order_items"("p_production_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_production_order_items"("p_production_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."decrease_product_lot_quantity"("p_lot_id" "uuid", "p_quantity" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."decrease_product_lot_quantity"("p_lot_id" "uuid", "p_quantity" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrease_product_lot_quantity"("p_lot_id" "uuid", "p_quantity" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_purchase_requisition_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_purchase_requisition_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_purchase_requisition_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_order_status_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."recalculate_cart_totals"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalculate_cart_totals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalculate_cart_totals"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_order_payment_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_order_payment_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_order_payment_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_order_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_order_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_order_timestamp"() TO "service_role";



GRANT ALL ON TABLE "public"."abandoned_carts" TO "anon";
GRANT ALL ON TABLE "public"."abandoned_carts" TO "authenticated";
GRANT ALL ON TABLE "public"."abandoned_carts" TO "service_role";



GRANT ALL ON TABLE "public"."accounts_receivable" TO "anon";
GRANT ALL ON TABLE "public"."accounts_receivable" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts_receivable" TO "service_role";



GRANT ALL ON TABLE "public"."accounts_receivable_payments" TO "anon";
GRANT ALL ON TABLE "public"."accounts_receivable_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."accounts_receivable_payments" TO "service_role";



GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_permissions" TO "anon";
GRANT ALL ON TABLE "public"."admin_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."ai_product_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."ai_product_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_product_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."ai_search_queries" TO "anon";
GRANT ALL ON TABLE "public"."ai_search_queries" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_search_queries" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_sales_by_day" TO "anon";
GRANT ALL ON TABLE "public"."analytics_sales_by_day" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_sales_by_day" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_top_products" TO "anon";
GRANT ALL ON TABLE "public"."analytics_top_products" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_top_products" TO "service_role";



GRANT ALL ON TABLE "public"."approvals" TO "anon";
GRANT ALL ON TABLE "public"."approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."approvals" TO "service_role";



GRANT ALL ON TABLE "public"."automation_rules" TO "anon";
GRANT ALL ON TABLE "public"."automation_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."automation_rules" TO "service_role";



GRANT ALL ON TABLE "public"."cart_items" TO "anon";
GRANT ALL ON TABLE "public"."cart_items" TO "authenticated";
GRANT ALL ON TABLE "public"."cart_items" TO "service_role";



GRANT ALL ON TABLE "public"."carts" TO "anon";
GRANT ALL ON TABLE "public"."carts" TO "authenticated";
GRANT ALL ON TABLE "public"."carts" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON TABLE "public"."cold_chain_logs" TO "anon";
GRANT ALL ON TABLE "public"."cold_chain_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."cold_chain_logs" TO "service_role";



GRANT ALL ON TABLE "public"."cold_chain_rules" TO "anon";
GRANT ALL ON TABLE "public"."cold_chain_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."cold_chain_rules" TO "service_role";



GRANT ALL ON TABLE "public"."coupon_redemptions" TO "anon";
GRANT ALL ON TABLE "public"."coupon_redemptions" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_redemptions" TO "service_role";



GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";



GRANT ALL ON TABLE "public"."customer_addresses" TO "anon";
GRANT ALL ON TABLE "public"."customer_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_addresses" TO "service_role";



GRANT ALL ON TABLE "public"."customer_credit_accounts" TO "anon";
GRANT ALL ON TABLE "public"."customer_credit_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_credit_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."customer_events" TO "anon";
GRANT ALL ON TABLE "public"."customer_events" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_events" TO "service_role";



GRANT ALL ON TABLE "public"."customer_ltv" TO "anon";
GRANT ALL ON TABLE "public"."customer_ltv" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_ltv" TO "service_role";



GRANT ALL ON TABLE "public"."customer_metrics" TO "anon";
GRANT ALL ON TABLE "public"."customer_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."customer_segment_members" TO "anon";
GRANT ALL ON TABLE "public"."customer_segment_members" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_segment_members" TO "service_role";



GRANT ALL ON TABLE "public"."customer_segments" TO "anon";
GRANT ALL ON TABLE "public"."customer_segments" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_segments" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_sales_summary" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_sales_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_sales_summary" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_top_customers" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_top_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_top_customers" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_top_products" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_top_products" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_top_products" TO "service_role";



GRANT ALL ON TABLE "public"."deliveries" TO "anon";
GRANT ALL ON TABLE "public"."deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_drivers" TO "anon";
GRANT ALL ON TABLE "public"."delivery_drivers" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_drivers" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_routes" TO "anon";
GRANT ALL ON TABLE "public"."delivery_routes" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_routes" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_slots" TO "anon";
GRANT ALL ON TABLE "public"."delivery_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_slots" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_status_history" TO "anon";
GRANT ALL ON TABLE "public"."delivery_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."demand_forecasts" TO "anon";
GRANT ALL ON TABLE "public"."demand_forecasts" TO "authenticated";
GRANT ALL ON TABLE "public"."demand_forecasts" TO "service_role";



GRANT ALL ON TABLE "public"."email_queue" TO "anon";
GRANT ALL ON TABLE "public"."email_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."email_queue" TO "service_role";



GRANT ALL ON TABLE "public"."families" TO "anon";
GRANT ALL ON TABLE "public"."families" TO "authenticated";
GRANT ALL ON TABLE "public"."families" TO "service_role";



GRANT ALL ON TABLE "public"."flavors" TO "anon";
GRANT ALL ON TABLE "public"."flavors" TO "authenticated";
GRANT ALL ON TABLE "public"."flavors" TO "service_role";



GRANT ALL ON TABLE "public"."ingredients" TO "anon";
GRANT ALL ON TABLE "public"."ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_adjustments" TO "anon";
GRANT ALL ON TABLE "public"."inventory_adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_adjustments" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_movements" TO "anon";
GRANT ALL ON TABLE "public"."inventory_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_movements" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_reservations" TO "anon";
GRANT ALL ON TABLE "public"."inventory_reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_reservations" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_stock_by_item" TO "anon";
GRANT ALL ON TABLE "public"."inventory_stock_by_item" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_stock_by_item" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_available_to_promise" TO "anon";
GRANT ALL ON TABLE "public"."inventory_available_to_promise" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_available_to_promise" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_batches" TO "anon";
GRANT ALL ON TABLE "public"."inventory_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_batches" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_levels" TO "anon";
GRANT ALL ON TABLE "public"."inventory_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_levels" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_locations" TO "anon";
GRANT ALL ON TABLE "public"."inventory_locations" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_locations" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_lots" TO "anon";
GRANT ALL ON TABLE "public"."inventory_lots" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_lots" TO "service_role";



GRANT ALL ON TABLE "public"."product_lots" TO "anon";
GRANT ALL ON TABLE "public"."product_lots" TO "authenticated";
GRANT ALL ON TABLE "public"."product_lots" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_pick_suggestions" TO "anon";
GRANT ALL ON TABLE "public"."inventory_pick_suggestions" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_pick_suggestions" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_product_lots_fefo" TO "anon";
GRANT ALL ON TABLE "public"."inventory_product_lots_fefo" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_product_lots_fefo" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."inventory_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_snapshots_daily" TO "anon";
GRANT ALL ON TABLE "public"."inventory_snapshots_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_snapshots_daily" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_stock" TO "anon";
GRANT ALL ON TABLE "public"."inventory_stock" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_stock" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoice_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invoice_payments" TO "anon";
GRANT ALL ON TABLE "public"."invoice_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."invoice_payments" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."live_order_status" TO "anon";
GRANT ALL ON TABLE "public"."live_order_status" TO "authenticated";
GRANT ALL ON TABLE "public"."live_order_status" TO "service_role";



GRANT ALL ON TABLE "public"."low_stock_alerts" TO "anon";
GRANT ALL ON TABLE "public"."low_stock_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."low_stock_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."production_orders" TO "anon";
GRANT ALL ON TABLE "public"."production_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."production_orders" TO "service_role";



GRANT ALL ON TABLE "public"."raw_materials" TO "anon";
GRANT ALL ON TABLE "public"."raw_materials" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_materials" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_items" TO "anon";
GRANT ALL ON TABLE "public"."recipe_items" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_items" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."mrp_requirements" TO "anon";
GRANT ALL ON TABLE "public"."mrp_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."mrp_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."mrp_purchase_requirements" TO "anon";
GRANT ALL ON TABLE "public"."mrp_purchase_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."mrp_purchase_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."order_shipments" TO "anon";
GRANT ALL ON TABLE "public"."order_shipments" TO "authenticated";
GRANT ALL ON TABLE "public"."order_shipments" TO "service_role";



GRANT ALL ON TABLE "public"."order_status_history" TO "anon";
GRANT ALL ON TABLE "public"."order_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."order_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."order_timeline" TO "anon";
GRANT ALL ON TABLE "public"."order_timeline" TO "authenticated";
GRANT ALL ON TABLE "public"."order_timeline" TO "service_role";



GRANT ALL ON TABLE "public"."payment_attempts" TO "anon";
GRANT ALL ON TABLE "public"."payment_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."payment_events" TO "anon";
GRANT ALL ON TABLE "public"."payment_events" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_events" TO "service_role";



GRANT ALL ON TABLE "public"."payment_proofs" TO "anon";
GRANT ALL ON TABLE "public"."payment_proofs" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_proofs" TO "service_role";



GRANT ALL ON TABLE "public"."payment_reconciliation" TO "anon";
GRANT ALL ON TABLE "public"."payment_reconciliation" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_reconciliation" TO "service_role";



GRANT ALL ON TABLE "public"."payment_terms" TO "anon";
GRANT ALL ON TABLE "public"."payment_terms" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_terms" TO "service_role";



GRANT ALL ON TABLE "public"."payment_transactions" TO "anon";
GRANT ALL ON TABLE "public"."payment_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."payment_webhooks" TO "anon";
GRANT ALL ON TABLE "public"."payment_webhooks" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_webhooks" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON TABLE "public"."picking_order_items" TO "anon";
GRANT ALL ON TABLE "public"."picking_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."picking_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."picking_orders" TO "anon";
GRANT ALL ON TABLE "public"."picking_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."picking_orders" TO "service_role";



GRANT ALL ON TABLE "public"."preparation_types" TO "anon";
GRANT ALL ON TABLE "public"."preparation_types" TO "authenticated";
GRANT ALL ON TABLE "public"."preparation_types" TO "service_role";



GRANT ALL ON TABLE "public"."price_history" TO "anon";
GRANT ALL ON TABLE "public"."price_history" TO "authenticated";
GRANT ALL ON TABLE "public"."price_history" TO "service_role";



GRANT ALL ON TABLE "public"."pricing_rules" TO "anon";
GRANT ALL ON TABLE "public"."pricing_rules" TO "authenticated";
GRANT ALL ON TABLE "public"."pricing_rules" TO "service_role";



GRANT ALL ON TABLE "public"."product_analytics_daily" TO "anon";
GRANT ALL ON TABLE "public"."product_analytics_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."product_analytics_daily" TO "service_role";



GRANT ALL ON TABLE "public"."product_badge_relations" TO "anon";
GRANT ALL ON TABLE "public"."product_badge_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."product_badge_relations" TO "service_role";



GRANT ALL ON TABLE "public"."product_badges" TO "anon";
GRANT ALL ON TABLE "public"."product_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."product_badges" TO "service_role";



GRANT ALL ON TABLE "public"."product_embeddings" TO "anon";
GRANT ALL ON TABLE "public"."product_embeddings" TO "authenticated";
GRANT ALL ON TABLE "public"."product_embeddings" TO "service_role";



GRANT ALL ON TABLE "public"."product_families" TO "anon";
GRANT ALL ON TABLE "public"."product_families" TO "authenticated";
GRANT ALL ON TABLE "public"."product_families" TO "service_role";



GRANT ALL ON TABLE "public"."product_forecasting" TO "anon";
GRANT ALL ON TABLE "public"."product_forecasting" TO "authenticated";
GRANT ALL ON TABLE "public"."product_forecasting" TO "service_role";



GRANT ALL ON TABLE "public"."product_images" TO "anon";
GRANT ALL ON TABLE "public"."product_images" TO "authenticated";
GRANT ALL ON TABLE "public"."product_images" TO "service_role";



GRANT ALL ON TABLE "public"."product_nutrition" TO "anon";
GRANT ALL ON TABLE "public"."product_nutrition" TO "authenticated";
GRANT ALL ON TABLE "public"."product_nutrition" TO "service_role";



GRANT ALL ON TABLE "public"."product_recommendations" TO "anon";
GRANT ALL ON TABLE "public"."product_recommendations" TO "authenticated";
GRANT ALL ON TABLE "public"."product_recommendations" TO "service_role";



GRANT ALL ON TABLE "public"."product_seo" TO "anon";
GRANT ALL ON TABLE "public"."product_seo" TO "authenticated";
GRANT ALL ON TABLE "public"."product_seo" TO "service_role";



GRANT ALL ON TABLE "public"."product_tag_relations" TO "anon";
GRANT ALL ON TABLE "public"."product_tag_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."product_tag_relations" TO "service_role";



GRANT ALL ON TABLE "public"."product_tags" TO "anon";
GRANT ALL ON TABLE "public"."product_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."product_tags" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."production_consumptions" TO "anon";
GRANT ALL ON TABLE "public"."production_consumptions" TO "authenticated";
GRANT ALL ON TABLE "public"."production_consumptions" TO "service_role";



GRANT ALL ON TABLE "public"."production_costs" TO "anon";
GRANT ALL ON TABLE "public"."production_costs" TO "authenticated";
GRANT ALL ON TABLE "public"."production_costs" TO "service_role";



GRANT ALL ON TABLE "public"."production_lines" TO "anon";
GRANT ALL ON TABLE "public"."production_lines" TO "authenticated";
GRANT ALL ON TABLE "public"."production_lines" TO "service_role";



GRANT ALL ON TABLE "public"."production_lot_consumptions" TO "anon";
GRANT ALL ON TABLE "public"."production_lot_consumptions" TO "authenticated";
GRANT ALL ON TABLE "public"."production_lot_consumptions" TO "service_role";



GRANT ALL ON TABLE "public"."production_order_consumptions" TO "anon";
GRANT ALL ON TABLE "public"."production_order_consumptions" TO "authenticated";
GRANT ALL ON TABLE "public"."production_order_consumptions" TO "service_role";



GRANT ALL ON TABLE "public"."production_order_items" TO "anon";
GRANT ALL ON TABLE "public"."production_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."production_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."production_outputs" TO "anon";
GRANT ALL ON TABLE "public"."production_outputs" TO "authenticated";
GRANT ALL ON TABLE "public"."production_outputs" TO "service_role";



GRANT ALL ON TABLE "public"."production_schedules" TO "anon";
GRANT ALL ON TABLE "public"."production_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."production_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."proof_of_delivery" TO "anon";
GRANT ALL ON TABLE "public"."proof_of_delivery" TO "authenticated";
GRANT ALL ON TABLE "public"."proof_of_delivery" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_order_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_requisition_items" TO "anon";
GRANT ALL ON TABLE "public"."purchase_requisition_items" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_requisition_items" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_requisitions" TO "anon";
GRANT ALL ON TABLE "public"."purchase_requisitions" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_requisitions" TO "service_role";



GRANT ALL ON TABLE "public"."raw_material_lots" TO "anon";
GRANT ALL ON TABLE "public"."raw_material_lots" TO "authenticated";
GRANT ALL ON TABLE "public"."raw_material_lots" TO "service_role";



GRANT ALL ON TABLE "public"."recipe_ingredients" TO "anon";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "authenticated";
GRANT ALL ON TABLE "public"."recipe_ingredients" TO "service_role";



GRANT ALL ON TABLE "public"."refunds" TO "anon";
GRANT ALL ON TABLE "public"."refunds" TO "authenticated";
GRANT ALL ON TABLE "public"."refunds" TO "service_role";



GRANT ALL ON TABLE "public"."related_products" TO "anon";
GRANT ALL ON TABLE "public"."related_products" TO "authenticated";
GRANT ALL ON TABLE "public"."related_products" TO "service_role";



GRANT ALL ON TABLE "public"."sales_daily" TO "anon";
GRANT ALL ON TABLE "public"."sales_daily" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_daily" TO "service_role";



GRANT ALL ON TABLE "public"."sales_order_items" TO "anon";
GRANT ALL ON TABLE "public"."sales_order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_order_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales_order_profit" TO "anon";
GRANT ALL ON TABLE "public"."sales_order_profit" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_order_profit" TO "service_role";



GRANT ALL ON TABLE "public"."sales_orders" TO "anon";
GRANT ALL ON TABLE "public"."sales_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."sales_orders" TO "service_role";



GRANT ALL ON TABLE "public"."scheduled_jobs" TO "anon";
GRANT ALL ON TABLE "public"."scheduled_jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."scheduled_jobs" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_methods" TO "anon";
GRANT ALL ON TABLE "public"."shipping_methods" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_methods" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_rates" TO "anon";
GRANT ALL ON TABLE "public"."shipping_rates" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_rates" TO "service_role";



GRANT ALL ON TABLE "public"."shipping_zones" TO "anon";
GRANT ALL ON TABLE "public"."shipping_zones" TO "authenticated";
GRANT ALL ON TABLE "public"."shipping_zones" TO "service_role";



GRANT ALL ON TABLE "public"."stock_alerts" TO "anon";
GRANT ALL ON TABLE "public"."stock_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."stock_reservations" TO "anon";
GRANT ALL ON TABLE "public"."stock_reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_reservations" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."tenant_members" TO "anon";
GRANT ALL ON TABLE "public"."tenant_members" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_members" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."units_of_measure" TO "anon";
GRANT ALL ON TABLE "public"."units_of_measure" TO "authenticated";
GRANT ALL ON TABLE "public"."units_of_measure" TO "service_role";



GRANT ALL ON TABLE "public"."user_admin_permissions" TO "anon";
GRANT ALL ON TABLE "public"."user_admin_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_admin_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."warehouses" TO "anon";
GRANT ALL ON TABLE "public"."warehouses" TO "authenticated";
GRANT ALL ON TABLE "public"."warehouses" TO "service_role";



GRANT ALL ON TABLE "public"."waste_tracking" TO "anon";
GRANT ALL ON TABLE "public"."waste_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."waste_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."webhook_events" TO "anon";
GRANT ALL ON TABLE "public"."webhook_events" TO "authenticated";
GRANT ALL ON TABLE "public"."webhook_events" TO "service_role";



GRANT ALL ON TABLE "public"."whatsapp_queue" TO "anon";
GRANT ALL ON TABLE "public"."whatsapp_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."whatsapp_queue" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
