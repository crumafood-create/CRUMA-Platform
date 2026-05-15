import { redirect } from 'next/navigation';

import { getUser }
from '@/domains/auth/services/get-user';

export default async function AdminPage() {

  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (

    <main>

      <h1>
        Admin Dashboard
      </h1>

    </main>
  );
}
