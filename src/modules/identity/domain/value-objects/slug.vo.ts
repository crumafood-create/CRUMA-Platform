export class Slug {
  private readonly value: string;

  constructor(value: string) {
    const slug = value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');

    if (!slug.length) {
      throw new Error('Invalid slug');
    }

    this.value = slug;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }
}
