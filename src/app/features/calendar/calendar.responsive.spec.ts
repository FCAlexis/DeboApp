import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const componentPath = join(__dirname, 'calendar.component.ts');

describe('Calendar Component — Responsive (RF03, RF12, RF13)', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(componentPath, 'utf-8');
  });

  /* ── RF03: Touch targets ── */
  it('should set .back-btn to min 44x44px on mobile (RF03)', () => {
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-width\s*:\s*44px/);
    expect(source).toMatch(/@media[\s\S]*back-btn[\s\S]*min-height\s*:\s*44px/);
  });

  /* ── RF12: Navigation buttons shrink at 400px ── */
  it('should shrink .cal-nav-btn to 36x36px at 400px (RF12)', () => {
    expect(source).toMatch(/@media[\s\S]*cal-nav-btn[\s\S]*width\s*:\s*36px/);
    expect(source).toMatch(/@media[\s\S]*cal-nav-btn[\s\S]*height\s*:\s*36px/);
  });

  /* ── RF13: Calendar day cells responsive ── */
  it('should reduce .cal-day-cell min-height at 600px and 400px (RF13)', () => {
    expect(source).toMatch(/@media[\s\S]*cal-day-cell[\s\S]*min-height\s*:\s*64px/);
    expect(source).toMatch(/@media[\s\S]*cal-day-cell[\s\S]*min-height\s*:\s*48px/);
  });
});
