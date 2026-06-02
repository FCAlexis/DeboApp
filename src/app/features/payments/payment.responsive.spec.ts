import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const componentPath = join(__dirname, 'payment.component.ts');

describe('Payment Component — Responsive (RF11, RF03)', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(componentPath, 'utf-8');
  });

  /* ── 5.1 Card padding cap ── */
  it('should cap .payment-card and .receipt-card padding to 1.5rem below 600px (RF11)', () => {
    expect(source).toMatch(/@media[\s\S]*payment-card[\s\S]*padding\s*:\s*1\.5rem/);
    expect(source).toMatch(/@media[\s\S]*receipt-card[\s\S]*padding\s*:\s*1\.5rem/);
  });

  /* ── 5.1 Touch target ── */
  it('should set .back-btn to min 44x44px on mobile (RF03)', () => {
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-width\s*:\s*44px/);
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-height\s*:\s*44px/);
  });
});
