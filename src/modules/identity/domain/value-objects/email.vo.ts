export class Email {
  private readonly value: string;

  constructor(value: string) {
    const email = value.trim().toLowerCase();

    const regex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!regex.test(email)) {
      throw new Error('Invalid email');
    }

    this.value = email;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
