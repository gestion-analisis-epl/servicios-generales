import { describe, expect, it } from 'vitest';
import { getEffectiveCategoria } from './GetEffectiveCategoria';

describe('getEffectiveCategoria', () => {
  it('returns the correction when present', () => {
    expect(getEffectiveCategoria('OTRO', 'MANTENIMIENTO')).toBe('MANTENIMIENTO');
  });

  it('returns the original categoria when there is no correction', () => {
    expect(getEffectiveCategoria('MANTENIMIENTO', '')).toBe('MANTENIMIENTO');
  });

  it('returns OTRO when there is no correction yet', () => {
    expect(getEffectiveCategoria('OTRO', '')).toBe('OTRO');
  });
});
