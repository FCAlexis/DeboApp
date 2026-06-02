import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const componentPath = join(__dirname, 'purchase.component.ts');

describe('Purchase Component — Responsive (RF08, RF03)', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(componentPath, 'utf-8');
  });

  /* ── 4.1 Form rows collapse ── */
  it('should collapse .row to 1fr below 600px (RF08)', () => {
    expect(source).toMatch(/@media[\s\S]*\.row[\s\S]*grid-template-columns\s*:\s*1fr/);
  });

  /* ── 4.3 Touch targets ── */
  it('should set .back-btn to min 44x44px on mobile (RF03)', () => {
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-width\s*:\s*44px/);
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-height\s*:\s*44px/);
  });
});
