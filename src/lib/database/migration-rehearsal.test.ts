import { describe, expect, it } from 'vitest';

import { assertDisposableDatabaseUrl } from '../../../scripts/database/migration-reconciliation';

const EXPECTED_ERROR = 'El ensayo solo admite la base local desechable.';

describe('assertDisposableDatabaseUrl', () => {
  it('acepta únicamente la base local dedicada al ensayo', () => {
    const input =
      'postgresql://postgres:postgres@127.0.0.1:54322/cruma_reconciliation_rehearsal';

    expect(assertDisposableDatabaseUrl(input)).toBe(input);
  });

  it.each([
    'postgresql://postgres:secret@aws-1-us-west-2.pooler.supabase.com:5432/postgres',
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
    'postgresql://postgres:postgres@127.0.0.1:5432/cruma_reconciliation_rehearsal',
    'https://127.0.0.1:54322/cruma_reconciliation_rehearsal',
    'not-a-url',
  ])('rechaza un destino no desechable: %s', (input) => {
    expect(() => assertDisposableDatabaseUrl(input)).toThrow(EXPECTED_ERROR);
  });
});
