import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const componentPath = join(__dirname, 'dashboard.component.ts');

describe('Dashboard Component — Responsive (RF02, RF05, RF12, RF03)', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(componentPath, 'utf-8');
  });

  /* ── 2.1 Bootstrap dead classes ── */
  it('should NOT contain d-none class in template (RF02)', () => {
    expect(source).not.toMatch(/class=[\'\"]d-none/);
  });

  it('should NOT contain d-lg-block class in template (RF02)', () => {
    expect(source).not.toMatch(/d-lg-block/);
  });

  it('should NOT contain d-lg-none class in template (RF02)', () => {
    expect(source).not.toMatch(/d-lg-none/);
  });

  it('should have @media query hiding .sidebar on mobile (RF02)', () => {
    expect(source).toMatch(/@media[\s\S]*sidebar[\s\S]*display\s*:\s*none/i);
  });

  it('should have @media query showing .bottom-nav on mobile (RF02)', () => {
    expect(source).toMatch(/@media[\s\S]*bottom-nav[\s\S]*display\s*:\s*flex/i);
  });

  /* ── 2.2 Grid collapse ── */
  it('should collapse .stats-grid to 1fr below 600px (RF05)', () => {
    // Look for a media query that sets grid-template-columns: 1fr for stats-grid
    expect(source).toMatch(/@media[\s\S]*?stats-grid[\s\S]*?grid-template-columns\s*:\s*1fr/);
  });

  it('should collapse .charts-grid to 1fr below 600px (RF05)', () => {
    expect(source).toMatch(/@media[\s\S]*?charts-grid[\s\S]*?grid-template-columns\s*:\s*1fr/);
  });

  /* ── 2.3 Chart height ── */
  it('should reduce .chart-container height to 180px below 600px (RF12)', () => {
    expect(source).toMatch(/@media[\s\S]*?chart-container[\s\S]*?height\s*:\s*180px/);
  });

  /* ── 2.4 Touch targets ── */
  it('should set .btn-icon to min 44x44px on mobile (RF03)', () => {
    expect(source).toMatch(/@media[\s\S]*?btn-icon[\s\S]*?min-width\s*:\s*44px/);
    expect(source).toMatch(/@media[\s\S]*?btn-icon[\s\S]*?min-height\s*:\s*44px/);
  });
});
