import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const componentPath = join(__dirname, 'person-detail.component.ts');

describe('PersonDetail Component — Responsive (RF07, RF03)', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(componentPath, 'utf-8');
  });

  /* ── 3.2 Profile actions collapse ── */
  it('should collapse .profile-actions to 1fr below 600px (RF07)', () => {
    expect(source).toMatch(/@media[\s\S]*profile-actions[\s\S]*grid-template-columns\s*:\s*1fr/);
  });

  /* ── 3.3 Touch targets ── */
  it('should set .back-btn to min 44x44px on mobile (RF03)', () => {
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-width\s*:\s*44px/);
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-height\s*:\s*44px/);
  });
});
