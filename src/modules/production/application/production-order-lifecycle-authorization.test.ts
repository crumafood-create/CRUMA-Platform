import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const PRODUCTION_ACTIONS =
  '../../../app/(admin)/production-orders/actions.ts';

const FORECAST_ACTIONS =
  '../../../app/(admin)/demand-forecasts/actions.ts';

const NEW_ORDER_PAGE =
  '../../../app/(admin)/production-orders/new/page.tsx';

const ORDER_DETAIL_PAGE =
  '../../../app/(admin)/production-orders/[id]/page.tsx';

const ORDER_FORM =
  '../../manufacturing/components/forms/production-order-form.tsx';

function file(path: string): string {
  return readFileSync(
    new URL(path, import.meta.url),
    'utf8',
  );
}

function actionSource(
  path: string,
  action: string,
): string {
  const source = file(path);
  const start = source.indexOf(
    `export async function ${action}`,
  );
  const next = source.indexOf(
    'export async function ',
    start + 1,
  );

  if (start < 0) {
    throw new Error(
      `Acción no encontrada: ${action}`,
    );
  }

  return source.slice(
    start,
    next < 0 ? undefined : next,
  );
}

function formSource(
  page: string,
  action: string,
): string {
  const marker = `action={${action}`;
  const start = page.indexOf(marker);
  const end = page.indexOf('</form>', start);

  if (start < 0 || end < 0) {
    throw new Error(
      `Formulario no encontrado: ${action}`,
    );
  }

  return page.slice(start, end);
}

describe(
  'autorización del ciclo de vida de órdenes de producción',
  () => {
    it(
      'crea la orden y su plan mediante la RPC atómica',
      () => {
        const body = actionSource(
          PRODUCTION_ACTIONS,
          'createProductionOrder',
        );

        expect(body).toContain(
          'buildProductionOrderCreationRequest(',
        );

        expect(body).toContain(
          'createProductionOrderDraft(',
        );

        expect(body).not.toContain(
          ".from('production_orders')",
        );

        expect(body).not.toContain(
          'create_production_order_items',
        );
      },
    );

    it.each([
      [
        'releaseProductionOrder',
        'release',
      ],
      [
        'startProductionOrder',
        'start',
      ],
      [
        'cancelProductionOrder',
        'cancel',
      ],
    ] as const)(
      'delega %s a la transición atómica %s',
      (action, transition) => {
        const body = actionSource(
          PRODUCTION_ACTIONS,
          action,
        );

        expect(body).toContain(
          'buildProductionOrderTransitionRequest(',
        );

        expect(body).toContain(
          `transition: '${transition}'`,
        );

        expect(body).toContain(
          'transitionProductionOrderLifecycle(',
        );

        expect(body).not.toContain(
          ".from('production_orders')",
        );

        expect(body).not.toContain('.update(');
      },
    );

    it(
      'crea órdenes desde forecast mediante la misma RPC',
      () => {
        const body = actionSource(
          FORECAST_ACTIONS,
          'createProductionOrderFromForecast',
        );

        expect(body).toContain(
          'buildProductionOrderCreationRequest(',
        );

        expect(body).toContain(
          'createProductionOrderDraft(',
        );

        expect(body).not.toContain(
          ".from('production_orders')",
        );

        expect(body).not.toContain(
          'create_production_order_items',
        );
      },
    );

    it(
      'envía una clave idempotente al crear una orden',
      () => {
        const page = file(NEW_ORDER_PAGE);
        const form = file(ORDER_FORM);

        expect(page).toContain(
          "import crypto from 'node:crypto'",
        );

        expect(page).toContain(
          'crypto.randomUUID()',
        );

        expect(page).toContain(
          'idempotencyKey={',
        );

        expect(form).toContain(
          'idempotencyKey: string;',
        );

        expect(form).toContain(
          'name="idempotency_key"',
        );

        expect(form).toContain(
          'value={idempotencyKey}',
        );
      },
    );

    it.each([
      'releaseProductionOrder',
      'startProductionOrder',
      'cancelProductionOrder',
    ])(
      'envía idempotencia desde el formulario de %s',
      (action) => {
        const page = file(ORDER_DETAIL_PAGE);
        const form = formSource(page, action);

        expect(form).toContain(
          'name="idempotency_key"',
        );

        expect(form).toContain(
          'crypto.randomUUID()',
        );
      },
    );

    it(
      'exige el motivo de cancelación desde la interfaz',
      () => {
        const page = file(ORDER_DETAIL_PAGE);
        const form = formSource(
          page,
          'cancelProductionOrder',
        );

        expect(form).toContain('name="reason"');
        expect(form).toContain('required');
        expect(form).toContain('maxLength={500}');
      },
    );

    it(
      'elimina las rutas heredadas de escritura',
      () => {
        const productionActions =
          file(PRODUCTION_ACTIONS);

        const forecastActions =
          file(FORECAST_ACTIONS);

        expect(productionActions).not.toContain(
          'generateOrderNumber',
        );

        expect(productionActions).not.toContain(
          'create_production_order_items',
        );

        expect(forecastActions).not.toContain(
          'generateProductionNumber',
        );

        expect(forecastActions).not.toContain(
          'create_production_order_items',
        );
      },
    );
  },
);
