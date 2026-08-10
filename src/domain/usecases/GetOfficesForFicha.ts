import { Office } from '../entities/Office';

export function getOfficesForFicha(offices: Office[]): Office[] {
  return [...offices].sort((a, b) => a.codigo.localeCompare(b.codigo));
}
