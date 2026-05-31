export class UserId {
  private readonly value: string;

  constructor(value: string) {
    if (!value?.trim()) {
      throw new Error('UserId is required');
    }

    this.value = value.trim();
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
