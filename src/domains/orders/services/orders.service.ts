import {
  getOrders,
  getOrderById
}
from '../repositories/orders.repository';

export async function fetchOrders() {

  return getOrders();
}

export async function fetchOrder(
  id: string
) {

  return getOrderById(id);
}
