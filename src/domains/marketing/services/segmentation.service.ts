import 'server-only';

export function segmentCustomers(
  customers: any[]
) {

  return {

    vip: customers.filter(
      customer =>
        customer.lifetime_value > 1000
    ),

    regular: customers.filter(
      customer =>
        customer.lifetime_value <= 1000
    )
  };
}

