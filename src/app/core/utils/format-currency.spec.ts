import { describe, it, expect } from 'vitest';
import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
  it('should format ARS cents', () => {
    expect(formatCurrency(123400, 'ARS')).toContain('1.234');
  });

  it('should format USD cents', () => {
    expect(formatCurrency(123400, 'USD')).toContain('1.234');
  });

  it('should handle zero', () => {
    expect(formatCurrency(0, 'ARS')).toContain('0');
  });
});
