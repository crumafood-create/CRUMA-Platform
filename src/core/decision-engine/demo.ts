import { analyzeInventoryRisk } from './inventory-risk-engine';

import {
  addThreadItem,
  getThreadItems,
} from '@/core/executive-thread/thread-store';

const recommendation = analyzeInventoryRisk({
  tenantId: 'cruma-demo',
  productId: 'harina-premium',
  productName: 'Harina Premium',
  currentStock: 12,
  minimumStock: 100,
});

if (recommendation) {
  addThreadItem({
    id: recommendation.id,
    title: recommendation.title,
    description: recommendation.summary,
    status: recommendation.status,
    createdAt: recommendation.createdAt,
  });
}

console.log(getThreadItems());
