'use client';

import { useRealtimeInventory }
from '../hooks/use-realtime-inventory';

export function LiveInventoryListener() {

  useRealtimeInventory();

  return null;
}
