import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const componentPath = join(__dirname, 'notification-container.component.ts');

describe('NotificationContainer Component — Responsive (RF10)', () => {
  let source: string;

  beforeAll(() => {
    source = readFileSync(componentPath, 'utf-8');
  });

  /* ── 5.2 Reposition on small viewports ── */
  it('should reposition .notification-container to full-width centered below 400px (RF10)', () => {
    expect(source).toMatch(/@media\s*\(max-width:\s*400px\)[\s\S]*\.notification-container[\s\S]*\{/);
  });
});
