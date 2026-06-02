# Tasks: CHG-003-settings — Settings Page

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~640 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Infrastructure) → PR 2 (Settings Page) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | formatCurrency + SettingsService + component refactors + tests | PR 1 | ~350 lines. Base: main. Shared utility, service, 5 components refactored, PersonsComponent dynamic defaults. |
| 2 | SettingsComponent + routes + tests | PR 2 | ~290 lines. Base: main (after PR 1). Depends on SettingsService from PR 1. |

## Phase 1: Foundation — Shared Utility

- [ ] 1.1 Create `src/app/core/utils/format-currency.ts` — pure `formatCurrency(cents, currency)` using `Intl.NumberFormat('es-AR', {...})`
- [ ] 1.2 Create `src/app/core/services/settings.service.ts` — signal-based `currency`, `defaultClosingDay`, `defaultDueDay` persisted to localStorage key `deboapp-settings`
- [ ] 1.3 Implement `updateSetting()`, `resetDefaults()`, `clearAllData()` in SettingsService

## Phase 2: Implementation — Settings Page

- [ ] 2.1 Create `src/app/features/settings/settings.component.ts` — inline template + styles: currency select, closing/due day inputs (1-31), export/import buttons, delete-all with confirmation, about section
- [ ] 2.2 Replace `PlaceholderComponent` with `SettingsComponent` in `src/app/app.routes.ts` for path `/settings`
- [ ] 2.3 Create `src/app/features/settings/settings.component.spec.ts` — test all sections, currency change, responsive layout

## Phase 3: Integration — Component Refactoring

- [ ] 3.1 Refactor `dashboard.component.ts` — remove inline `formatCurrency()`, import shared, inject SettingsService, pass `currency()` to calls
- [ ] 3.2 Refactor `payment.component.ts` — same pattern
- [ ] 3.3 Refactor `person-detail.component.ts` — same pattern
- [ ] 3.4 Refactor `payments-list.component.ts` — same pattern
- [ ] 3.5 Refactor `debts.component.ts` — same pattern
- [ ] 3.6 Update `persons.component.ts` — inject SettingsService, replace hardcoded 15/5 defaults with `defaultClosingDay()` / `defaultDueDay()` signals

## Phase 4: Verification — Tests

- [ ] 4.1 Create `src/app/core/utils/format-currency.spec.ts` — ARS/USD/EUR formats, zero, unknown currency
- [ ] 4.2 Create `src/app/core/services/settings.service.spec.ts` — defaults, persistence, updateSetting, resetDefaults, clearAllData
- [ ] 4.3 Update `dashboard.component.spec.ts` — use shared `formatCurrency` import, remove method tests
- [ ] 4.4 Update `payment.component.spec.ts` — same
- [ ] 4.5 Update `person-detail.component.spec.ts` — same
- [ ] 4.6 Update `payments-list.component.spec.ts` — same
- [ ] 4.7 Update `debts.component.spec.ts` — same
- [ ] 4.8 Update `persons.component.spec.ts` — test dynamic defaults from SettingsService
