import 'server-only';

import {
  getProducts,
  getProductBySlug
}
from '../repositories/catalog.repository';

export async function fetchProducts() {

  return getProducts();
}

export async function fetchProduct(
  slug: string
) {

  return getProductBySlug(slug);
}
