const FAMILY_DICTIONARY: Record<string, string> = {
  tequeños: 'TEQUE',
  tequeño: 'TEQUE',
  empanadas: 'EMPA',
  empanada: 'EMPA',
  dulce: 'DULC',
  salado: 'SALA',
  tradicional: 'TRAD',
  moderno: 'MODO',
  especial: 'ESPEC',
  premium: 'PREM',
};

export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function toFamilyCode(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .map((word) => FAMILY_DICTIONARY[word] ?? word.slice(0, 4).toUpperCase())
    .join('-');
}
