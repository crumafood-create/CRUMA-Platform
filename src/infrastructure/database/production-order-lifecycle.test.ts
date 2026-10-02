import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/' +
  '20261002010000_harden_production_order_lifecycle.sql';

const GENERATED_TYPES =
  '../../types/database/database.generated.ts';

const REPOSITORY =
  '../../modules/production/application/' +
  'production-order-lifecycle-repository.ts';

function file(path: string): string {
  return readFileSync(
    new URL(path, import.meta.url),
    'utf8',
  );
}

function source(): string {
  return file(MIGRATION);
}

function normalizeSql(
  value: string,
): string {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

describe(
  'ciclo de vida atómico de órdenes de producción',
  () => {
    it(
      'registra operaciones idempotentes y auditables',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'CREATE TABLE ' +
            'public.production_order_lifecycle_operations',
        );

        expect(migration).toContain(
          'idempotency_key uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'production_order_id uuid NOT NULL',
        );

        expect(migration).toContain(
          'operation text NOT NULL',
        );

        expect(migration).toContain(
          "'create'",
        );

        expect(migration).toContain(
          "'release'",
        );

        expect(migration).toContain(
          "'start'",
        );

        expect(migration).toContain(
          "'cancel'",
        );

        expect(migration).toContain(
          'previous_status text',
        );

        expect(migration).toContain(
          'new_status text NOT NULL',
        );

        expect(migration).toContain(
          'performed_by uuid NOT NULL',
        );
      },
    );

    it(
      'declara la creación atómica de una orden',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'CREATE OR REPLACE FUNCTION ' +
            'public.create_production_order_draft(',
        );

        expect(migration).toContain(
          'p_recipe_id uuid',
        );

        expect(migration).toContain(
          'p_planned_quantity integer',
        );

        expect(migration).toContain(
          'p_notes text',
        );

        expect(migration).toContain(
          'p_idempotency_key uuid',
        );

        expect(migration).toContain(
          'RETURNS uuid',
        );

        expect(migration).toContain(
          'SECURITY DEFINER SET search_path =',
        );

        expect(migration).toContain(
          'IF NOT public.is_admin(auth.uid())',
        );
      },
    );

    it(
      'crea la orden y su plan de materiales en una transacción',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'pg_advisory_xact_lock',
        );

        expect(migration).toContain(
          'FROM public.recipes',
        );

        expect(migration).toContain(
          'INSERT INTO public.production_orders',
        );

        expect(migration).toContain(
          'INSERT INTO public.production_order_items',
        );

        expect(migration).toContain(
          'FROM public.recipe_items',
        );

        expect(migration).toContain(
          "production_status = 'draft'",
        );

        expect(migration).toContain(
          'RETURN v_order_id',
        );
      },
    );

    it(
      'declara una transición atómica bloqueando la orden',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'CREATE OR REPLACE FUNCTION ' +
            'public.transition_production_order_lifecycle(',
        );

        expect(migration).toContain(
          'p_production_order_id uuid',
        );

        expect(migration).toContain(
          'p_transition text',
        );

        expect(migration).toContain(
          'p_reason text',
        );

        expect(migration).toContain(
          'FROM public.production_orders',
        );

        expect(migration).toContain(
          'FOR UPDATE',
        );
      },
    );

    it(
      'aplica únicamente transiciones válidas',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          "p_transition = 'release'",
        );

        expect(migration).toContain(
          "order_row.production_status = 'draft'",
        );

        expect(migration).toContain(
          "p_transition = 'start'",
        );

        expect(migration).toContain(
          "order_row.production_status = 'released'",
        );

        expect(migration).toContain(
          "p_transition = 'cancel'",
        );

        expect(migration).toContain(
          "order_row.production_status IN ( 'draft', 'released' )",
        );

        expect(migration).toContain(
          'Production order transition is invalid.',
        );

        expect(migration).toContain(
          'UPDATE public.production_orders',
        );
      },
    );

    it(
      'hace idempotentes la creación y las transiciones',
      () => {
        const migration =
          normalizeSql(source());

        expect(
          migration
            .split(
              'WHERE idempotency_key = ' +
                'p_idempotency_key',
            )
            .length - 1,
        ).toBeGreaterThanOrEqual(2);

        expect(
          migration
            .split(
              'Idempotency key was reused ' +
                'with different data.',
            )
            .length - 1,
        ).toBeGreaterThanOrEqual(2);

        expect(
          migration
            .split(
              'RETURN ' +
                'existing_operation.production_order_id',
            )
            .length - 1,
        ).toBeGreaterThanOrEqual(2);
      },
    );

    it(
      'cierra escrituras fragmentadas y protege las RPC',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'DROP POLICY IF EXISTS ' +
            'production_orders_insert ' +
            'ON public.production_orders',
        );

        expect(migration).toContain(
          'DROP POLICY IF EXISTS ' +
            'production_orders_update ' +
            'ON public.production_orders',
        );

        expect(migration).toContain(
          'DROP POLICY IF EXISTS ' +
            'production_orders_delete ' +
            'ON public.production_orders',
        );

        expect(migration).toContain(
          'REVOKE INSERT, UPDATE, DELETE ON TABLE ' +
            'public.production_orders, ' +
            'public.production_order_items ' +
            'FROM anon, authenticated',
        );

        expect(migration).toContain(
          'REVOKE ALL ON FUNCTION ' +
            'public.create_production_order_items(',
        );

        expect(migration).toContain(
          'GRANT EXECUTE ON FUNCTION ' +
            'public.create_production_order_draft(',
        );

        expect(migration).toContain(
          'GRANT EXECUTE ON FUNCTION ' +
            'public.transition_production_order_lifecycle(',
        );

        expect(migration).toContain(
          'ENABLE ROW LEVEL SECURITY',
        );

        expect(migration).toContain(
          'USING (public.is_admin(auth.uid()))',
        );
      },
    );
    it(
      'sincroniza la auditoría y las RPC en los tipos Supabase',
      () => {
        const generatedTypes =
          file(GENERATED_TYPES);

        const normalizedTypes =
          generatedTypes
            .replace(/\s+/g, ' ')
            .trim();

        const repository =
          file(REPOSITORY);

        expect(generatedTypes).toContain(
          'production_order_lifecycle_operations: {',
        );

        const tableStart =
          generatedTypes.indexOf(
            'production_order_lifecycle_operations: {',
          );

        const tableEnd =
          generatedTypes.indexOf(
            '      production_orders: {',
            tableStart,
          );

        expect(tableStart).toBeGreaterThanOrEqual(0);
        expect(tableEnd).toBeGreaterThan(tableStart);

        const table = generatedTypes.slice(
          tableStart,
          tableEnd,
        );

        expect(table).toContain(
          'idempotency_key: string',
        );

        expect(table).toContain(
          'production_order_id: string',
        );

        expect(table).toContain(
          'operation: string',
        );

        expect(table).toContain(
          'recipe_id: string | null',
        );

        expect(table).toContain(
          'planned_quantity: number | null',
        );

        expect(table).toContain(
          'notes: string | null',
        );

        expect(table).toContain(
          'reason: string | null',
        );

        expect(table).toContain(
          'previous_status: string | null',
        );

        expect(table).toContain(
          'new_status: string',
        );

        expect(table).toContain(
          'performed_by: string',
        );

        expect(normalizedTypes).toContain(
          'create_production_order_draft: { ' +
            'Args: { ' +
            'p_idempotency_key: string ' +
            'p_notes: string ' +
            'p_planned_quantity: number ' +
            'p_recipe_id: string ' +
            '} Returns: string }',
        );

        expect(normalizedTypes).toContain(
          'transition_production_order_lifecycle: { ' +
            'Args: { ' +
            'p_idempotency_key: string ' +
            'p_production_order_id: string ' +
            'p_reason: string ' +
            'p_transition: string ' +
            '} Returns: string }',
        );

        expect(repository).toContain(
          "await supabase.rpc(",
        );

        expect(repository).not.toContain(
          'as unknown as',
        );
      },
    );

  },
);
