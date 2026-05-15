'use client';

import { loginAction }
from '../actions/login.action';

import { Button }
from '@/shared/ui/button';

import { Input }
from '@/shared/forms/input';

export function LoginForm() {

  return (

    <form
      action={loginAction}
      className="space-y-4"
    >

      <Input
        name="email"
        type="email"
        placeholder="Correo"
      />

      <Input
        name="password"
        type="password"
        placeholder="Contraseña"
      />

      <Button type="submit">

        Ingresar

      </Button>

    </form>
  );
}
