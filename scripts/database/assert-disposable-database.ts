import { assertDisposableDatabaseUrl } from './migration-reconciliation.ts';

const input = process.argv[2];

if (!input) {
  throw new Error('Falta la URL de la base de ensayo.');
}

assertDisposableDatabaseUrl(input);
process.stdout.write('DISPOSABLE_DATABASE_TARGET=OK\n');
