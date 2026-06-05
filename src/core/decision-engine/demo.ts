import { analyzeInventoryRisk } from './inventory-risk-engine';

const recommendation = analyzeInventoryRisk({
  tenantId: 'cruma-demo',
  productId: 'harina-premium',
  productName: 'Harina Premium',
  currentStock: 12,
  minimumStock: 100,
});

console.log(recommendation);
