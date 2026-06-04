export class PermissionId {
  private readonly value: string;

  constructor(value: string) {
    if (!value?.trim()) {
      throw new Error('PermissionId is required');
    }

    this.value = value.trim();
  }

  toString(): string {
    return this.value;
  }

  equals(other: PermissionId): boolean {
    return this.value === other.value;
  }
}
