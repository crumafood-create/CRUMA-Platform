export class TenantId {
  private readonly value: string;

  constructor(value: string) {
    if (!value?.trim()) {
      throw new Error('TenantId is required');
    }

    this.value = value.trim();
  }

  toString(): string {
    return this.value;
  }

  equals(other: TenantId): boolean {
    return this.value === other.value;
  }
}
