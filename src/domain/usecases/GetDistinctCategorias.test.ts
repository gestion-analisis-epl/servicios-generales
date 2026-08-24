import { describe, expect, it } from 'vitest';
import { getDistinctCategorias } from './GetDistinctCategorias';

describe('getDistinctCategorias', () => {
  it('excludes OTRO and returns unique sorted categories', () => {
    const tickets = [
      { categoria: 'MANTENIMIENTO' },
      { categoria: 'OTRO' },
      { categoria: 'LIMPIEZA' },
      { categoria: 'MANTENIMIENTO' }
    ];
    expect(getDistinctCategorias(tickets)).toEqual(['LIMPIEZA', 'MANTENIMIENTO']);
  });

  it('excludes empty categorias', () => {
    expect(getDistinctCategorias([{ categoria: '' }])).toEqual([]);
  });
});
