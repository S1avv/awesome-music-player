import { describe, it, expect } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime util', () => {
  it('formats exactly 0 seconds as "0:00"', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('formats under a minute correctly', () => {
    expect(formatTime(45)).toBe('0:45');
    expect(formatTime(9)).toBe('0:09');
  });

  it('formats over a minute correctly', () => {
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(120)).toBe('2:00');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('handles invalid inputs gracefully', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
    expect(formatTime(-10)).toBe('0:00'); // Edge case
  });
});
