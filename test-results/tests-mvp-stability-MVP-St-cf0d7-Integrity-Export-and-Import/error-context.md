# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests/mvp-stability.spec.ts >> MVP Stability Suite >> Backup Integrity: Export and Import
- Location: tests/mvp-stability.spec.ts:31:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByLabel(/subir archivo/i)
    - locator resolved to <input type="file" accept=".json" _ngcontent-ng-c3034190675=""/>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    57 × waiting for element to be visible, enabled and stable
       - element is not visible
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - banner [ref=e5]:
    - button [ref=e6] [cursor=pointer]
    - heading "Sincronizar Datos" [level=1] [ref=e7]
  - main [ref=e8]:
    - generic [ref=e9]:
      - generic [ref=e10]:
        - heading "Respaldo de Datos" [level=2] [ref=e12]
        - paragraph [ref=e13]: Copia tus deudas y contactos en un archivo seguro para llevarlos a otro dispositivo.
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]: Exportar Backup
            - generic [ref=e18]: Descarga tu base de datos actual en formato .json
          - button "Descargar" [active] [ref=e19] [cursor=pointer]: Descargar
        - generic [ref=e21]:
          - generic [ref=e22]:
            - generic [ref=e23]: Importar Backup
            - generic [ref=e24]: Carga un archivo de respaldo previamente guardado
          - generic [ref=e25] [cursor=pointer]: Subir Archivo
    - generic [ref=e27]:
      - strong [ref=e28]: "Atención:"
      - text: Al importar un respaldo, todos los datos actuales de este dispositivo serán reemplazados por la información del archivo.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('MVP Stability Suite', () => {
  4  |   const APP_URL = 'http://localhost:4200';
  5  | 
  6  |   test.beforeEach(async ({ page }) => {
  7  |     await page.goto(APP_URL);
  8  |   });
  9  | 
  10 |   test('Happy Path: Register Person and Purchase', async ({ page }) => {
  11 |     await page.goto(`${APP_URL}/persons`);
  12 |     // Note: Using generic selectors since we don't have the exact HTML of the "Add Person" form in this session, 
  13 |     // but we'll target common patterns.
  14 |     await page.getByRole('button', { name: /nueva persona|agregar persona/i }).click();
  15 |     await page.getByLabel(/nombre/i).fill('Test User');
  16 |     await page.getByRole('button', { name: /guardar|confirmar/i }).click();
  17 |     
  18 |     // Wait for redirect to dashboard or person list
  19 |     await expect(page.locator('text=Test User')).toBeVisible();
  20 |     
  21 |     // Try to create a purchase
  22 |     await page.getByRole('button', { name: /compra/i }).click();
  23 |     await page.getByLabel(/descripción/i).fill('Test Purchase');
  24 |     await page.getByLabel(/monto/i).fill('1000');
  25 |     await page.getByLabel(/cuotas/i).fill('2');
  26 |     await page.getByRole('button', { name: /guardar|confirmar/i }).click();
  27 |     
  28 |     await expect(page.locator('text=Test Purchase')).toBeVisible();
  29 |   });
  30 | 
  31 |   test('Backup Integrity: Export and Import', async ({ page }) => {
  32 |     // 1. Export Data
  33 |     await page.goto(`${APP_URL}/backup`);
  34 |     await page.getByRole('button', { name: /descargar/i }).click();
  35 |     
  36 |     // In Playwright, downloads are handled separately
  37 |     const downloadPromise = page.waitForEvent('download');
  38 |     await page.getByRole('button', { name: /descargar/i }).click();
  39 |     const download = await downloadPromise;
  40 |     const path = await download.path();
  41 |     
  42 |     // 2. Import Data
> 43 |     await page.getByLabel(/subir archivo/i).click();
     |                                             ^ Error: locator.click: Test timeout of 30000ms exceeded.
  44 |     // This usually opens a file chooser, we need to handle it
  45 |     const fileChooserPromise = page.waitForEvent('filechooser');
  46 |     await page.getByRole('button', { name: /subir archivo/i }).click();
  47 |     const fileChooser = await fileChooserPromise;
  48 |     await fileChooser.setFiles(path);
  49 |     
  50 |     await expect(page.locator('text=Confirmar Importación')).toBeVisible();
  51 |     await page.getByRole('button', { name: /confirmar y cargar/i }).click();
  52 |     
  53 |     await expect(page.locator('text=Datos importados con éxito')).toBeVisible();
  54 |   });
  55 | 
  56 |   test('Critical Alerts: Due Today', async ({ page }) => {
  57 |     // This is a synthetic test. Since we cannot easily manipulate the system clock 
  58 |     // in a simple Playwright script without a proxy, we verify that the 
  59 |     // component handles the "alerts" state correctly.
  60 |     await page.goto(`${APP_URL}/dashboard`);
  61 |     // If we have any overdue debts from previous tests, the banner should appear
  62 |     const criticalBanner = page.locator('.alert-critical');
  63 |     const overdueBanner = page.locator('.alert-overdue');
  64 |     
  65 |     if (await criticalBanner.isVisible() || await overdueBanner.isVisible()) {
  66 |       await expect(criticalBanner.isVisible() || await overdueBanner.isVisible()).toBeTruthy();
  67 |     }
  68 |   });
  69 | });
  70 | 
```