export function parseMoney(raw: unknown): number {
  if (raw === undefined || raw === null) return 0;
  const digitsOnly = String(raw).replace(/[^0-9.-]/g, '');
  const value = parseFloat(digitsOnly);
  return isNaN(value) ? 0 : value;
}

export function parseSheetDate(raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') return '';

  const text = String(raw).trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/);
  if (!match) return text;

  const [, day, month, year, rest] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}${rest}`;
}
