'use client';

import { createOrderAction }
from '../actions/create-order.action';

import { Button }
from '@/shared/ui/button';

import { Input }
from '@/shared/forms/input';

export function CheckoutForm() {

  return (

    <form
      action={createOrderAction}
      className="space-y-4"
    >

      <Input
        name="fullName"
        placeholder="Nombre"
      />

      <Input
        name="phone"
        placeholder="Teléfono"
      />

      <Input
        name="address"
        placeholder="Dirección"
      />

      <Input
        name="city"
        placeholder="Ciudad"
      />

      <Input
        name="state"
        placeholder="Estado"
      />

      <Input
        name="postalCode"
        placeholder="Código Postal"
      />

      <Button type="submit">

        Crear pedido

      </Button>

    </form>
  );
}
