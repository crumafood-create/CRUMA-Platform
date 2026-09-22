export type ProviderError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export type QueryResult<T> = {
  data: T | null;
  error: ProviderError | null;
};

export class DatabaseQueryError extends Error {
  readonly code: string | undefined;
  readonly resource: string;
  readonly details: string | undefined;

  constructor(resource: string, providerError: ProviderError) {
    // Plantilla exacta que esperan los tests de dominio e infraestructura
    super(`No fue posible cargar ${resource}.`, { cause: providerError });
    this.name = 'DatabaseQueryError';
    this.code = providerError.code;
    this.details = providerError.details;
    this.resource = resource;
  }
}

export class NotFoundError extends Error {
  readonly resource: string;

  constructor(resource: string) {
    // Plantilla exacta para los contratos singulares
    super(`No se encontró ${resource}.`);
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

function unwrap<T>(result: QueryResult<T>, resource: string): T | null {
  if (result.error) {
    throw new DatabaseQueryError(resource, result.error);
  }
  return result.data;
}

/**
 * Garantiza que la consulta devuelva una lista de registros. Retorna un array vacío si el resultado es nulo.
 */
export function requireRows<T>(
  result: QueryResult<T[]>,
  resource: string = 'registros',
): T[] {
  return unwrap(result, resource) ?? [];
}

/**
 * Devuelve el registro obtenido o null si la consulta fue exitosa pero no trajo datos.
 */
export function requireOptional<T>(
  result: QueryResult<T>,
  resource: string = 'registro',
): T | null {
  return unwrap(result, resource);
}

/**
 * Exige que exista un único registro. Lanza `NotFoundError` si la consulta no devuelve datos.
 */
export function requireSingle<T>(
  result: QueryResult<T>,
  resource: string = 'registro',
): T {
  const value = requireOptional(result, resource);
  if (value === null || value === undefined) {
    throw new NotFoundError(resource);
  }
  return value;
}

/**
 * Alias de compatibilidad para consultas singulares
 */
export const requireSingleRow = requireSingle;