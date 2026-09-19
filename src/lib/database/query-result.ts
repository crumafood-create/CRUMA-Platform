type ProviderError = {
  code?: string;
  message?: string;
};

type QueryResult<T> = {
  data: T | null;
  error: ProviderError | null;
};

export class DatabaseQueryError extends Error {
  readonly code: string | undefined;
  readonly resource: string;

  constructor(resource: string, providerError: ProviderError) {
    super(`No fue posible cargar ${resource}.`, { cause: providerError });
    this.name = 'DatabaseQueryError';
    this.code = providerError.code;
    this.resource = resource;
  }
}

function unwrap<T>(result: QueryResult<T>, resource: string): T | null {
  if (result.error) throw new DatabaseQueryError(resource, result.error);
  return result.data;
}

export function requireRows<T>(
  result: QueryResult<T[]>,
  resource: string,
): T[] {
  return unwrap(result, resource) ?? [];
}

export function requireOptional<T>(
  result: QueryResult<T>,
  resource: string,
): T | null {
  return unwrap(result, resource);
}

export function requireSingle<T>(
  result: QueryResult<T>,
  resource: string,
): T {
  const value = requireOptional(result, resource);
  if (value === null) throw new Error(`No se encontró ${resource}.`);
  return value;
}
