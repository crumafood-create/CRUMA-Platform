import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    coverage: {
      include: [
        'src/modules/inventory/application/utils/product-code.ts',
        'scripts/database/migration-history.ts',
        'src/infrastructure/database/query-result.ts',
        'src/modules/identity/permissions/permissions.service.ts',
        'src/modules/analytics/application/dashboard-filters.ts',
        'src/modules/analytics/application/dashboard-summary.ts',
        'src/modules/analytics/application/dashboard-repository.ts',
        'src/modules/analytics/application/business-report-contract.ts',
        'src/modules/analytics/application/business-report-export.ts',
        'src/modules/analytics/application/business-report-period.ts',
        'src/modules/analytics/application/business-report-repository.ts',
        'src/modules/inventory/application/inventory-alert-contract.ts',
        'src/modules/inventory/application/inventory-alert-repository.ts',
        'src/modules/inventory/application/inventory-stock-repository.ts',
        'src/modules/production/application/production-priority.ts',
        'src/modules/sales/application/sales-order-contract.ts',
        'src/modules/sales/application/sales-order-presentation.ts',
        'src/modules/storefront/application/storefront-product-contract.ts',
        'src/components/storefront/catalog-explorer.tsx',
        'src/shared/ui/feedback/error-state.tsx',
      ],
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: [
            'src/**/*.test.{ts,tsx}',
          ],
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
});
