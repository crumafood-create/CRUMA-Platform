import { getB2BCustomers }
from '../repositories/b2b.repository';

export async function fetchB2BCustomers() {

  return getB2BCustomers();
}
