import { describe, expect, it } from 'vitest';
import { formatDuration } from './FormatDuration';

describe('formatDuration', () => {
  it('returns an empty string for zero or negative input', () => {
    expect(formatDuration(0)).toBe('');
    expect(formatDuration(-10)).toBe('');
  });

  it('formats minutes only when under an hour', () => {
    expect(formatDuration(5 * 60)).toBe('5m');
  });

  it('formats hours and minutes when under a day', () => {
    expect(formatDuration(2 * 3600 + 30 * 60)).toBe('2h 30m');
  });

  it('formats days, hours and minutes', () => {
    expect(formatDuration(2 * 86400 + 5 * 3600 + 30 * 60)).toBe('2d 5h 30m');
  });
});
