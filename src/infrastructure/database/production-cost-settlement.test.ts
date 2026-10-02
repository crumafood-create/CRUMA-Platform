import { readFileSync } from 'node:fs';

import {
  describe,
  expect,
  it,
} from 'vitest';

const MIGRATION =
  '../../../supabase/migrations/' +
  '20261002020000_harden_production_cost_settlement.sql';

function source(): string {
  return readFileSync(
    new URL(
      MIGRATION,
      import.meta.url,
    ),
    'utf8',
  );
}

function normalizeSql(
  value: string,
): string {
  return value
    .replace(/\s+/g, ' ')
    .trim();
}

describe(
  'cierre atómico de costos de producción',
  () => {
    it(
      'registra operaciones idempotentes y auditables',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'CREATE TABLE ' +
            'public.production_cost_settlement_operations',
        );

        expect(migration).toContain(
          'idempotency_key uuid NOT NULL UNIQUE',
        );

        expect(migration).toContain(
          'production_cost_id uuid NOT NULL',
        );

        expect(migration).toContain(
          'production_output_id uuid NOT NULL',
        );

        expect(migration).toContain(
          'calculation_version integer NOT NULL',
        );

        expect(migration).toContain(
          'settled_by uuid NOT NULL',
        );
      },
    );

    it(
      'protege la auditoría con RLS administrativo',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'ALTER TABLE ' +
            'public.production_cost_settlement_operations ' +
            'ENABLE ROW LEVEL SECURITY',
        );

        expect(migration).toContain(
          'USING (public.is_admin(auth.uid()))',
        );

        expect(migration).toContain(
          'REVOKE ALL ON TABLE ' +
            'public.production_cost_settlement_operations',
        );

        expect(migration).toContain(
          'GRANT SELECT ON TABLE ' +
            'public.production_cost_settlement_operations',
        );
      },
    );

    it(
      'declara la RPC de cierre conciliado',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'CREATE OR REPLACE FUNCTION ' +
            'public.settle_production_cost(',
        );

        expect(migration).toContain(
          'p_production_order_id uuid',
        );

        expect(migration).toContain(
          'p_labor_cost numeric',
        );

        expect(migration).toContain(
          'p_overhead_cost numeric',
        );

        expect(migration).toContain(
          'p_idempotency_key uuid',
        );

        expect(migration).toContain(
          'RETURNS uuid',
        );
      },
    );

    it(
      'serializa reintentos y protege la idempotencia',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'pg_advisory_xact_lock',
        );

        expect(migration).toContain(
          'FROM ' +
            'public.production_cost_settlement_operations',
        );

        expect(migration).toContain(
          'Idempotency key was reused with different data.',
        );

        expect(migration).toContain(
          'RETURN ' +
            'existing_operation.production_cost_id',
        );
      },
    );

    it(
      'bloquea la orden, la salida y los consumos',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'FROM public.production_orders',
        );

        expect(migration).toContain(
          'FROM public.production_outputs',
        );

        expect(migration).toContain(
          'FROM ' +
            'public.production_order_consumptions',
        );

        expect(
          migration.match(
            /FOR UPDATE/g,
          ) ?? [],
        ).toHaveLength(3);
      },
    );

    it(
      'exige una orden terminada y una salida en cuarentena',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          "production_status " +
            "IS DISTINCT FROM 'completed'",
        );

        expect(migration).toContain(
          "quality_status " +
            "IS DISTINCT FROM 'pending'",
        );

        expect(migration).toContain(
          'Production cost is frozen ' +
            'after quality disposition.',
        );

        expect(migration).toContain(
          'Production consumption is incomplete.',
        );
      },
    );

    it(
      'calcula desde snapshots y persiste todos los efectos',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'sum(consumption.total_cost)',
        );

        expect(migration).toContain(
          'INSERT INTO public.production_costs',
        );

        expect(migration).toContain(
          'ON CONFLICT (production_order_id) ' +
            'DO UPDATE',
        );

        expect(migration).toContain(
          'INSERT INTO ' +
            'public.production_cost_history',
        );

        expect(migration).toContain(
          'UPDATE public.production_orders',
        );

        expect(migration).toContain(
          'UPDATE public.production_outputs',
        );

        expect(migration).toContain(
          'INSERT INTO ' +
            'public.production_cost_settlement_operations',
        );
      },
    );

    it(
      'retira el cálculo heredado y protege la nueva RPC',
      () => {
        const migration =
          normalizeSql(source());

        expect(migration).toContain(
          'SECURITY DEFINER SET search_path =',
        );

        expect(migration).toContain(
          'REVOKE ALL ON FUNCTION ' +
            'public.calculate_production_cost(',
        );

        expect(migration).toContain(
          'REVOKE ALL ON FUNCTION ' +
            'public.settle_production_cost(',
        );

        expect(migration).toContain(
          'GRANT EXECUTE ON FUNCTION ' +
            'public.settle_production_cost(',
        );
      },
    );
  },
);
