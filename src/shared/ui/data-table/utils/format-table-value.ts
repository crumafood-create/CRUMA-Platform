export function formatTableValue(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return '-';
  }

  return String(value);
}
