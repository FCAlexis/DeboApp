# Tasks: Reports & Analytics (CHG-003-reports)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~380–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

## Phase 1: Foundation — New Signals (DebtStateService)

- [ ] 1.1 Add `monthlyInstallments` computed signal in `src/app/core/services/debt-state.service.ts` — groups installments by `"YYYY-MM"` key with `{ total, paid }` shape
- [ ] 1.2 Add `paidByPerson` computed signal — `Record<personId, cents>` aggregating `payments()` by `personId`
- [ ] 1.3 Add `personsWithPaid` computed signal — enriches `persons()` with `owed`, `paid`, `totalInstallments` from `debtByPerson()` and `paidByPerson()`

## Phase 2: Core Implementation — ReportsComponent

- [ ] 2.1 Create `src/app/features/reports/reports.component.ts` — standalone, OnPush, `period = signal<'6m'|'1y'|'all'>('6m')`, injects `DebtStateService`, computed `filteredTrend`/`recoveryWithTrend`, 3 Chart.js instances (bar trend, grouped bar persons, doughnut distribution), `calculateTrend()`, exportCSV()/exportJSON() via inline Blob, `buildExportData()`
- [ ] 2.2 Create `src/app/features/reports/reports.component.html` — period filter buttons, 3 chart canvases (`#debtTrendChart`, `#personChart`, `#distributionChart`), recovery rate card with trend arrow, export buttons, responsive grid layout
- [ ] 2.3 Create `src/app/features/reports/reports.component.css` — `.charts-grid` 2-col (≥768px) / 1-col (<768px), period pills, recovery rate big number, export button styles

## Phase 3: Integration — Routes

- [ ] 3.1 In `src/app/app.routes.ts`: import `ReportsComponent`, replace `PlaceholderComponent` with `ReportsComponent` for path `'/reports'`

## Phase 4: Tests

- [ ] 4.1 Write unit tests for `DebtStateService` signals — `monthlyInstallments` groups correctly, `paidByPerson` sums payments per person, `personsWithPaid` enriches both owed and paid, empty state returns empty
- [ ] 4.2 Write unit tests for period filter — switching period recomputes filtered data, empty months show $0
- [ ] 4.3 Write export tests — `exportCSV()` triggers download with correct MIME and headers, `exportJSON()` produces expected schema, no-op when data empty
- [ ] 4.4 Write component smoke test — `ReportsComponent` creates and renders period buttons + chart canvases
- [ ] 4.5 Write recovery rate trend tests — `calculateTrend()` returns `'up'`/`'down'`/`'flat'` based on half-period comparison, flat when insufficient data
