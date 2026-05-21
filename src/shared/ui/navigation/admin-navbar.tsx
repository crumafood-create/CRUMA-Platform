import { logoutAction }
from '@/domains/auth/actions/logout.action';

import { Button }
from '@/shared/ui/button';

export function AdminNavbar() {

  return (

    <header className="flex items-center justify-between border-b p-4">

      <h2>
        Admin
      </h2>

      <form action={logoutAction}>

        <Button type="submit">

          Logout

        </Button>

      </form>

    </header>
  );
}
