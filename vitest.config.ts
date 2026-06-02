import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    exclude: ['tests/**', 'node_modules/**'],
    setupFiles: ['./src/test-setup.ts'],
    css: true,
  },
});
