'use client';

import { useRealtimeOrders }
from '../hooks/use-realtime-orders';

export function LiveOrdersListener() {

  useRealtimeOrders();

  return null;
}
