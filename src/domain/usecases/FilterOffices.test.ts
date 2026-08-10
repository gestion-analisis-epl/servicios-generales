import { describe, expect, it } from 'vitest';
import { createOffice } from '../entities/Office';
import { filterOffices } from './FilterOffices';

function office(fields: Parameters<typeof createOffice>[0]) {
  return createOffice(fields);
}

describe('filterOffices', () => {
  const offices = [
    office({ codigo: 'AGS-EPL', ciudad: 'AGUASCALIENTES', estadoVigencia: '🟢 A TIEMPO' }),
    office({ codigo: 'LEON-EPL', ciudad: 'LEÓN', estadoVigencia: '⛔ VENCIDO' })
  ];

  it('returns everything when no filter key is provided', () => {
    expect(filterOffices(offices, {})).toHaveLength(2);
  });

  it('returns everything when a filter key is undefined (never touched)', () => {
    expect(filterOffices(offices, { ciudades: undefined })).toHaveLength(2);
  });

  it('excludes everything when a filter key is explicitly an empty array', () => {
    expect(filterOffices(offices, { ciudades: [] })).toHaveLength(0);
  });

  it('keeps only rows matching the explicit list', () => {
    const result = filterOffices(offices, { ciudades: ['LEÓN'] });
    expect(result.map((o) => o.codigo)).toEqual(['LEON-EPL']);
  });

  it('combines multiple filters with AND', () => {
    const result = filterOffices(offices, { ciudades: ['LEÓN'], estados: ['🟢 A TIEMPO'] });
    expect(result).toHaveLength(0);
  });
});
