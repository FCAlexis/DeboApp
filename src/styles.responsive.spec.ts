import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('styles.css — Responsive Custom Properties (RF01)', () => {
  let css: string;

  beforeAll(() => {
    css = readFileSync(join(__dirname, 'styles.css'), 'utf-8');
  });

  it('should define --sidebar-width on :root with value "0px" for mobile base', () => {
    expect(css).toContain('--sidebar-width');
    // The base value should be 0 for mobile-first
    // Desktop override should be in a media query
    expect(css).toMatch(/--sidebar-width\s*:\s*0/);
  });

  it('should define a desktop media query overriding --sidebar-width to 260px', () => {
    expect(css).toMatch(/@media\s*\(min-width:\s*1024px\)/);
    // Within that media query: --sidebar-width: 260px
    const desktopBlock = css.match(/@media\s*\(min-width:\s*1024px\)\s*\{([^}]+)\}/s);
    expect(desktopBlock).not.toBeNull();
    if (desktopBlock) {
      expect(desktopBlock[1]).toContain('--sidebar-width');
      expect(desktopBlock[1]).toMatch(/--sidebar-width\s*:\s*260/);
    }
  });

  it('should define --content-max-width on :root', () => {
    expect(css).toContain('--content-max-width');
    expect(css).toMatch(/--content-max-width\s*:\s*1200/);
  });

  it('should define responsive spacing scale (--space-sm, --space-md, --space-lg) on :root', () => {
    expect(css).toContain('--space-sm');
    expect(css).toContain('--space-md');
    expect(css).toContain('--space-lg');
  });

  it('should include breakpoint reference comments for --bp-mobile and --bp-tablet', () => {
    expect(css).toContain('600px');
    expect(css).toContain('1024px');
  });

  it('should have responsive container max-width for desktop', () => {
    // The main-content or container max-width should be set
    const desktopBlock = css.match(/@media\s*\(min-width:\s*1024px\)\s*\{([^}]+)\}/s);
    expect(desktopBlock).not.toBeNull();
    if (desktopBlock) {
      // Desktop should have content max-width constraint
      expect(desktopBlock[1]).toContain('max-width');
    }
  });

  it('should define media query structure starting at 600px breakpoint', () => {
    expect(css).toMatch(/@media\s*\(min-width:\s*600px\)/);
    expect(css).toMatch(/@media\s*\(min-width:\s*1024px\)/);
  });
});
