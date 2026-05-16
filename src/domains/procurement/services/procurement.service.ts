import { getSuppliers }
from '../repositories/procurement.repository';

export async function fetchSuppliers() {

  return getSuppliers();
}
