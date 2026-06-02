import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const componentPath = join(__dirname, 'backup.component.ts');

describe('Backup Component — Responsive (RF09, RF03)', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(componentPath, 'utf-8');
  });

  /* ── 4.2 Action items stack ── */
  it('should switch .action-item to flex-direction: column below 600px (RF09)', () => {
    expect(source).toMatch(/@media[\s\S]*action-item[\s\S]*flex-direction\s*:\s*column/);
  });

  /* ── 4.3 Touch targets ── */
  it('should set .back-btn to min 44x44px on mobile (RF03)', () => {
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-width\s*:\s*44px/);
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-height\s*:\s*44px/);
  });
});
