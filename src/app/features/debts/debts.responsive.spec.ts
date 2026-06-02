import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const componentPath = join(__dirname, 'debts.component.ts');

describe('Debts Component — Responsive (RF06, RF03)', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(componentPath, 'utf-8');
  });

  /* ── 3.1 Summary grid collapse ── */
  it('should collapse .summary-grid to 1fr below 600px (RF06)', () => {
    expect(source).toMatch(/@media[\s\S]*summary-grid[\s\S]*grid-template-columns\s*:\s*1fr/);
  });

  /* ── 3.3 Touch targets ── */
  it('should set .back-btn to min 44x44px on mobile (RF03)', () => {
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-width\s*:\s*44px/);
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-height\s*:\s*44px/);
  });
});
