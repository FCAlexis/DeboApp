# Tasks: Reports & Analytics (CHG-003-reports)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~380–450 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | single-pr-exception |

Decision needed before apply: Yes (resolved: size:exception)
Chained PRs recommended: No
Chain strategy: single-pr-exception
400-line budget risk: Medium

## Phase 1: Foundation — New Signals (DebtStateService)

- [x] 1.1 Add `monthlyInstallments` computed signal in `src/app/core/services/debt-state.service.ts` — groups installments by `"YYYY-MM"` key with `{ total, paid }` shape
- [x] 1.2 Add `paidByPerson` computed signal — `Record<personId, cents>` aggregating `payments()` by `personId`
- [x] 1.3 Add `personsWithPaid` computed signal — enriches `persons()` with `owed`, `paid`, `totalInstallments` from `debtByPerson()` and `paidByPerson()`

## Phase 2: Core Implementation — ReportsComponent

- [x] 2.1 Create `src/app/features/reports/reports.component.ts` — standalone, OnPush, `period = signal<'6m'|'1y'|'all'>('6m')`, injects `DebtStateService`, computed `filteredTrend`/`recoveryWithTrend`, 3 Chart.js instances (bar trend, grouped bar persons, doughnut distribution), `calculateTrend()`, exportCSV()/exportJSON() via inline Blob, `buildExportData()`
- [x] 2.2 Create `src/app/features/reports/reports.component.html` — period filter buttons, 3 chart canvases (`#debtTrendChart`, `#personChart`, `#distributionChart`), recovery rate card with trend arrow, export buttons, responsive grid layout
- [x] 2.3 Create `src/app/features/reports/reports.component.css` — `.charts-grid` 2-col (≥768px) / 1-col (<768px), period pills, recovery rate big number, export button styles

## Phase 3: Integration — Routes

- [x] 3.1 In `src/app/app.routes.ts`: import `ReportsComponent`, replace `PlaceholderComponent` with `ReportsComponent` for path `'/reports'`

## Phase 4: Tests

- [x] 4.1 Write unit tests for `DebtStateService` signals — `monthlyInstallments` groups correctly, `paidByPerson` sums payments per person, `personsWithPaid` enriches both owed and paid, empty state returns empty
- [x] 4.2 Write unit tests for period filter — switching period recomputes filtered data, empty months show $0
- [x] 4.3 Write export tests — `exportCSV()` triggers download with correct MIME and headers, `exportJSON()` produces expected schema, no-op when data empty
- [x] 4.4 Write component smoke test — `ReportsComponent` creates and renders period buttons + chart canvases
- [x] 4.5 Write recovery rate trend tests — `calculateTrend()` returns `'up'`/`'down'`/`'flat'` based on half-period comparison, flat when insufficient data
