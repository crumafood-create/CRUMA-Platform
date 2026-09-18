type QueryResult<T> = {
  data: T[] | null;
  error: unknown;
};

export function requireRows<T>(
  result: QueryResult<T>,
  resourceName: string,
): T[] {
  if (result.error) {
    throw new Error(`No fue posible cargar ${resourceName}.`, {
      cause: result.error,
    });
  }

  return result.data ?? [];
}
