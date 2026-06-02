# Proposal: Settings Page (CHG-003-settings)

## Intent

Replace the `/settings` placeholder route with a full app configuration page. Give users control over currency, default billing cycle days, and data management — while eliminating the duplicated `formatCurrency()` logic and hardcoded defaults across 5 components.

## Scope

### In Scope

- **Settings page** (`/settings`): Currency selector (ARS/USD/EUR), default closing day (1-31), default due day (1-31), "Delete all data" with confirmation, Export/Import buttons that reuse the existing backup flow, About section with app version
- **SettingsService**: Signal-based service persisted to `localStorage` under key `deboapp-settings`
- **formatCurrency utility**: Shared pure function extracted from 5 duplicate implementations — all components consume it, currency driven by `SettingsService`
- **Dynamic defaults**: `PersonsComponent` reads `defaultClosingDay` / `defaultDueDay` from `SettingsService` instead of hardcoded values
- **Responsive layout**: Settings page usable without horizontal scroll from 320px

### Out of Scope

- Multi-user/team settings, cloud sync, theme picker, language switcher, notification preferences, password/security settings

## Capabilities

### New Capabilities

- `settings`: App configuration page with currency selection, default billing cycle days, data management (delete all, export/import), and about section — all persisted to localStorage via a signal-based SettingsService

### Modified Capabilities

- `dashboard`: Replace inline `formatCurrency()` with shared utility — currency driven by SettingsService
- `payment` (payment form): Replace inline `formatCurrency()` with shared utility
- `person-detail`: Replace inline `formatCurrency()` with shared utility
- `payments-list`: Replace inline `formatCurrency()` with shared utility
- `debts`: Replace inline `formatCurrency()` with shared utility
- `persons` (person list): Replace inline `formatCurrency()` + use dynamic `closingDay`/`dueDay` defaults from SettingsService

## Approach

Create `SettingsService` (`src/app/core/services/settings.service.ts`) as a root-scoped injectable with writable signals backed by `localStorage`. Extract `formatCurrency` into a pure function at `src/app/core/utils/format-currency.ts`. Create standalone `SettingsComponent` at `src/app/features/settings/`. Wire `/settings` route to it. Refactor all 5 components + their tests to import and use the shared utility.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/features/settings/` | New | Settings component files (component, html, css, spec) |
| `src/app/core/services/settings.service.ts` | New | Signal-based localStorage service |
| `src/app/core/utils/format-currency.ts` | New | Shared pure function |
| `src/app/core/utils/` | New | Utility directory |
| `src/app/features/dashboard/dashboard.component.ts` | Modify | Replace inline `formatCurrency()` with import |
| `src/app/features/payments/payment.component.ts` | Modify | Replace inline `formatCurrency()` with import |
| `src/app/features/persons/person-detail.component.ts` | Modify | Replace inline `formatCurrency()` with import |
| `src/app/features/payments/payments-list.component.ts` | Modify | Replace inline `formatCurrency()` with import |
| `src/app/features/debts/debts.component.ts` | Modify | Replace inline `formatCurrency()` with import |
| `src/app/features/persons/persons.component.ts` | Modify | Replace inline `formatCurrency()` + use dynamic defaults |
| `src/app/app.routes.ts` | Modify | Wire `/settings` to SettingsComponent |
| `src/app/features/persons/persons.component.spec.ts` | Modify | Update formatCurrency + dynamic defaults tests |
| `src/app/features/dashboard/dashboard.component.spec.ts` | Modify | Update formatCurrency tests |
| `src/app/features/payments/payment.component.spec.ts` | Modify | Update formatCurrency tests |
| `src/app/features/payments/payments-list.component.spec.ts` | Modify | Update formatCurrency tests |
| `src/app/features/debts/debts.component.spec.ts` | Modify | Update formatCurrency tests |
| `src/app/features/persons/person-detail.component.spec.ts` | Modify | Update formatCurrency tests |

## Risks

Low. Most changes are mechanical refactoring of `formatCurrency` (same logic, just imported). The SettingsService introduces a new DI dependency — components that use `formatCurrency` remain pure since the utility is a function, not a service. The `SettingsService` default values match the current hardcoded ones (ARS, closingDay=15, dueDay=5), so behavior is preserved until the user changes them.

## Rollback Plan

Revert `app.routes.ts`. Delete `features/settings/`, `core/services/settings.service.ts`, `core/utils/`. Revert the 5 component files to their pre-refactor state and their test files.

## Success Criteria

- `/settings` renders a form with currency selector, closing/due day controls, delete-all, export/import, and about section
- Changing currency updates `formatCurrency()` output in all 5 components immediately
- Changing default closing/due day propagates to new person form defaults
- All values survive page reload
- All existing `formatCurrency()` tests pass using the shared utility
- No horizontal scroll at 320px width on settings page
