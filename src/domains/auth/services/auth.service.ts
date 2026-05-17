import 'server-only';

import {
  loginRepository,
  logoutRepository
}
from '../repositories/auth.repository';

export async function loginService(
  email: string,
  password: string
) {

  return loginRepository(
    email,
    password
  );
}

export async function logoutService() {

  return logoutRepository();
}
