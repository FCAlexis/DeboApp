# Proposal: Reports & Analytics (CHG-003-reports)

## Intent

Replace the `/reports` placeholder route with an analytics dashboard that surfaces deeper debt insights beyond what the dashboard provides — trends, per-person comparisons, payment distribution, and export.

## Scope

### In Scope

- **Deuda en el tiempo**: Line/bar chart showing debt balance grouped by month
- **Recuperación por persona**: Bar chart comparing total owed vs total paid per person
- **Distribución de pagos**: Pie chart showing how recovered amount distributes across persons
- **Tasa de recuperación**: Big number with trend indicator (up/down from previous period)
- **Período selector**: Toggle between "Últimos 6 meses", "Último año", "Todo"
- **Export CSV**: Download chart data as CSV file
- **Export JSON**: Download report data as JSON (reuses LocalDbService.exportData pattern)
- **Responsive layout**: Charts stack full-width below 600px

### Out of Scope

- PDF export, scheduled/email reports, custom date range picker, multi-currency, trend forecasting

## Capabilities

### New Capabilities

- `reports`: Analytics dashboard with monthly debt trend, per-person comparison, payment distribution, recovery rate, period filtering, and CSV/JSON export

### Modified Capabilities

None

## Approach

New standalone `ReportsComponent` at `src/app/features/reports/`. Add 2–3 new computed signals to `DebtStateService` (monthly installment grouping, paid-by-person aggregation). Reuse Chart.js (already installed). Period filter as `signal<Period>` in the component — computed signals react to it. Export via a shared utility or inline Blob generation. No new npm dependencies or DB schema changes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/features/reports/` | New | Reports component files |
| `src/app/core/services/debt-state.service.ts` | Modify | Add `monthlyInstallments`, `paidByPerson`, `personsWithPaid` computed signals |
| `src/app/app.routes.ts` | Modify | Wire `/reports` to ReportsComponent |

## Risks

Low — read-only analytics over existing state. Period filtering across month boundaries is the main edge case (months with no data should show zero, not be omitted).

## Rollback Plan

Revert `app.routes.ts`. Delete `features/reports/` directory. Revert signal additions in `debt-state.service.ts` (just remove the new computed blocks — no state cleanup needed).

## Success Criteria

- Line chart renders correct debt trend for each period selection
- Bar chart shows owed vs paid per person with matching values
- Pie chart accounts for all payments
- Recovery rate trend moves correctly (up when current > previous period)
- CSV download opens with correct MIME type
- JSON download matches current state
- No horizontal scroll at 375px width
