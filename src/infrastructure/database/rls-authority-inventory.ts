import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Inventario estático de autoridad RLS.
 *
 * Reconstruye la última definición de cada política a partir de las
 * migraciones. No modifica políticas ni demuestra su comportamiento.
 */
const MIGRATIONS = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../supabase/migrations',
);

export const RLS_AUTHORITY_INVENTORY_DATE = '2026-10-09' as const;

export type RlsAuthority =
  | 'is_admin_exclusive'
  | 'mixed'
  | 'not_is_admin';

export type RlsPolicyAuthority = {
  readonly table: string;
  readonly policy: string;
  readonly migration: string;
  readonly authority: RlsAuthority;
  readonly command: RlsCommand;
  readonly open: boolean;
};

export type RlsCommand =
  | 'select'
  | 'insert'
  | 'update'
  | 'delete'
  | 'all';

export type RlsDependencySummary = {
  readonly policies: number;
  readonly authority: Readonly<Record<RlsAuthority, number>>;
  readonly openReads: number;
  readonly openWrites: number;
  readonly missingReads: readonly string[];
  readonly functionGuards: number;
  readonly anonWriteGrants: number;
  readonly authenticatedWriteGrants: number;
};

const POLICY_PATTERN =
  /(?:drop|create)\s+policy\s+(?:if\s+exists\s+)?(?:"([^"]+)"|([A-Za-z_][\w$]*))/gi;

function statementAt(sql: string, index: number): string {
  let depth = 0;

  for (let cursor = index; cursor < sql.length; cursor += 1) {
    const character = sql[cursor];

    if (character === '(') {
      depth += 1;
    } else if (character === ')') {
      depth = Math.max(0, depth - 1);
    } else if (character === ';' && depth === 0) {
      return sql.slice(index, cursor + 1);
    }
  }

  return sql.slice(index);
}

function tableOf(statement: string): string | null {
  const match = statement.match(
    /\bon\s+(?:"?public"?\s*\.\s*)?"?([A-Za-z_][\w$]*)"?/i,
  );

  return match?.[1]?.toLowerCase() ?? null;
}

function normalized(statement: string): string {
  return statement
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .toLowerCase();
}

function authorityOf(statement: string): RlsAuthority {
  const value = normalized(statement);
  const usesAdmin = value.includes('is_admin');
  const usesTenant =
    value.includes('tenant_members') || value.includes('tenant_id');

  if (usesAdmin && usesTenant) {
    return 'mixed';
  }

  return usesAdmin ? 'is_admin_exclusive' : 'not_is_admin';
}

function commandOf(statement: string): RlsCommand {
  const match = normalized(statement).match(
    /\bfor\s+(select|insert|update|delete|all)\b/,
  );

  return (match?.[1] as RlsCommand | undefined) ?? 'all';
}

function isOpen(statement: string, command: RlsCommand): boolean {
  const value = normalized(statement);
  const usingOpen = /using\s*\(\s*true\s*\)/.test(value);
  const checkOpen = /with\s+check\s*\(\s*true\s*\)/.test(value);

  if (command === 'select' || command === 'delete') {
    return usingOpen;
  }

  if (command === 'insert') {
    return checkOpen;
  }

  return usingOpen || checkOpen;
}

const DYNAMIC_POLICY_RESET =
  /foreach\s+table_name\s+in\s+array\s+array\[([\s\S]*?)\]/gi;

function dynamicResetTables(sql: string): readonly string[] {
  return [...sql.matchAll(DYNAMIC_POLICY_RESET)].flatMap((match) => {
    const tables = match[1];

    return tables
      ? [...tables.matchAll(/'([A-Za-z_][\w$]*)'/g)].flatMap((tableMatch) =>
          tableMatch[1] ? [tableMatch[1].toLowerCase()] : [],
        )
      : [];
  });
}

export function inventoryRlsAuthority(
  migrationsDirectory = MIGRATIONS,
): readonly RlsPolicyAuthority[] {
  const policies = new Map<string, RlsPolicyAuthority>();

  for (const migration of readdirSync(migrationsDirectory).sort()) {
    if (!migration.endsWith('.sql')) {
      continue;
    }

    const sql = readFileSync(join(migrationsDirectory, migration), 'utf8');

    for (const table of dynamicResetTables(sql)) {
      for (const key of policies.keys()) {
        if (key.startsWith(`${table}.`)) {
          policies.delete(key);
        }
      }
    }

    for (const match of sql.matchAll(POLICY_PATTERN)) {
      const statement = statementAt(sql, match.index ?? 0);
      const table = tableOf(statement);
      const policy = (match[1] ?? match[2])?.toLowerCase();

      if (!table || !policy) {
        throw new Error(
          `No se pudo inventariar una política en ${migration}.`,
        );
      }

      const key = `${table}.${policy}`;

      if (match[0].toLowerCase().startsWith('drop')) {
        policies.delete(key);
        continue;
      }

      policies.set(key, {
        table,
        policy,
        migration,
        authority: authorityOf(statement),
        command: commandOf(statement),
        open: isOpen(statement, commandOf(statement)),
      });
    }
  }

  return [...policies.values()];
}

const TABLE_PRIVILEGE_PATTERN =
  /\b(grant|revoke)\s+(all|select|insert|update|delete|(?:select|insert|update|delete)(?:\s*,\s*(?:select|insert|update|delete)){1,3})\s+on\s+(?:table\s+)?((?:"public"\s*\.\s*)?(?:public\s*\.\s*)?"?[A-Za-z_][\w$]*"?)\s+(?:to|from)\s+((?:"?[A-Za-z_][\w$]*"?)(?:\s*,\s*"?[A-Za-z_][\w$]*"?)*)/gi;

const WRITE_PRIVILEGES = new Set(['insert', 'update', 'delete', 'all']);

type TableGrant = {
  readonly table: string;
  readonly role: string;
  readonly privileges: ReadonlySet<string>;
};

function privilegesOf(value: string): ReadonlySet<string> {
  return new Set(
    value.toLowerCase() === 'all'
      ? ['select', 'insert', 'update', 'delete']
      : value.toLowerCase().split(/\s*,\s*/),
  );
}

function inventoryTableGrants(
  migrationsDirectory: string,
): readonly TableGrant[] {
  const grants = new Map<string, Set<string>>();

  for (const migration of readdirSync(migrationsDirectory).sort()) {
    if (!migration.endsWith('.sql')) {
      continue;
    }

    const sql = readFileSync(join(migrationsDirectory, migration), 'utf8')
      .replace(/--.*$/gm, '')
      .replace(/\s+/g, ' ');

    for (const match of sql.matchAll(TABLE_PRIVILEGE_PATTERN)) {
      const [, operation, privileges, rawTable, rawRoles] = match;

      if (!operation || !privileges || !rawTable || !rawRoles) {
        throw new Error(`No se pudo inventariar un grant en ${migration}.`);
      }

      const table = rawTable
        .replace(/"/g, '')
        .replace(/^public\./i, '')
        .toLowerCase();
      const roles = rawRoles
        .replace(/"/g, '')
        .split(/\s*,\s*/)
        .map((role) => role.toLowerCase());

      for (const role of roles) {
        const key = `${table}.${role}`;
        const current = grants.get(key) ?? new Set<string>();

        for (const privilege of privilegesOf(privileges)) {
          if (operation.toLowerCase() === 'revoke') {
            current.delete(privilege);
          } else {
            current.add(privilege);
          }
        }

        grants.set(key, current);
      }
    }
  }

  return [...grants.entries()].map(([key, privileges]) => {
    const [table, role] = key.split('.');

    if (!table || !role) {
      throw new Error(`Grant inválido en el inventario: ${key}.`);
    }

    return { table, role, privileges };
  });
}

function countWriteGrants(
  grants: readonly TableGrant[],
  role: string,
): number {
  return grants.filter(
    (grant) =>
      grant.role === role &&
      [...grant.privileges].some((privilege) =>
        WRITE_PRIVILEGES.has(privilege),
      ),
  ).length;
}

const FUNCTION_GUARD_PATTERN =
  /if\s+not\s+public\.is_admin\s*\(\s*auth\.uid\s*\(\s*\)\s*\)/gi;

function countFunctionGuards(migrationsDirectory: string): number {
  return readdirSync(migrationsDirectory)
    .filter((migration) => migration.endsWith('.sql'))
    .reduce(
      (total, migration) =>
        total +
        (
          readFileSync(join(migrationsDirectory, migration), 'utf8').match(
            FUNCTION_GUARD_PATTERN,
          ) ?? []
        ).length,
      0,
    );
}

export function summarizeRlsDependencies(
  migrationsDirectory = MIGRATIONS,
  policies = inventoryRlsAuthority(migrationsDirectory),
): RlsDependencySummary {
  const open = policies.filter((policy) => policy.open);
  const reads = new Set(
    policies
      .filter((policy) =>
        ['select', 'all'].includes(policy.command),
      )
      .map((policy) => policy.table),
  );
  const writes = policies.filter(
    (policy) => policy.command !== 'select',
  );

  return {
    policies: policies.length,
    authority: {
      is_admin_exclusive: policies.filter(
        (policy) => policy.authority === 'is_admin_exclusive',
      ).length,
      mixed: policies.filter((policy) => policy.authority === 'mixed')
        .length,
      not_is_admin: policies.filter(
        (policy) => policy.authority === 'not_is_admin',
      ).length,
    },
    openReads: open.filter((policy) =>
      ['select', 'all'].includes(policy.command),
    ).length,
    openWrites: writes.filter((policy) => policy.open).length,
    missingReads: [
      ...new Set(policies.map((policy) => policy.table)),
    ]
      .filter((table) => !reads.has(table))
      .sort(),
    functionGuards: countFunctionGuards(migrationsDirectory),
    anonWriteGrants: countWriteGrants(
      inventoryTableGrants(migrationsDirectory),
      'anon',
    ),
    authenticatedWriteGrants: countWriteGrants(
      inventoryTableGrants(migrationsDirectory),
      'authenticated',
    ),
  };
}
