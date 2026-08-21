export const EXPECTED_SCHEMA_DRIFT_FINGERPRINT =
  '112eaa0b8899c0f3f489f9d3d7c950688171a8b40085085fc76c3d5b52a7b524';

export function assertEvidenceFingerprint(
  actual: string,
  expected: string,
): void {
  if (actual !== expected) {
    throw new Error('La evidencia remota cambió desde su aprobación.');
  }
}
