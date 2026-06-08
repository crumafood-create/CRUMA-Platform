const STOP_WORDS = new Set([
  'de', 'del', 'con', 'los', 'las',
  'el', 'la', 'y', 'a', 'en', 'al',
]);

const DICTIONARY: Record<string, string> = {
  tequenos: 'TEQ',
  tequeños: 'TEQ',
  empanada: 'EMP',
  empanadas: 'EMP',
  tradicional: 'TRAD',
  tradicionales: 'TRAD',
  party: 'PARTY',
  queso: 'QSO',
  guayaba: 'GYB',
  pizza: 'PIZ',
  chocolate: 'CHOC',
  crudo: 'CRU',
  crudos: 'CRU',
  pollo: 'POL',
  carne: 'CAR',
  espinaca: 'ESP',
  jamon: 'JAM',
  mini: 'MINI',
  grande: 'GRD',
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

export function toInternalCode(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((word) => !STOP_WORDS.has(word))
    .slice(0, 3)
    .map((word) => DICTIONARY[word] ?? word.slice(0, 4).toUpperCase())
    .join('-');
}
