import { LoginForm }
from '@/domains/auth/components/login-form';

export default function LoginPage() {

  return (

    <main className="mx-auto max-w-md py-20">

      <h1 className="mb-6 text-3xl font-bold">

        Login

      </h1>

      <LoginForm />

    </main>
  );
}
