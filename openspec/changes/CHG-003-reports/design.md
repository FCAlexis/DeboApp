# Design: Reports & Analytics (CHG-003-reports)

## Technical Approach

New standalone `ReportsComponent` at `src/app/features/reports/`. Adds 3 new computed signals to `DebtStateService`. Renders 3 Chart.js charts, a recovery rate widget with trend, a period filter, and export buttons. Reuses Chart.js (already installed, `chart.js/auto`). No new npm dependencies.

## Architecture Decisions

| Decision | Options | Chosen | Rationale |
|----------|---------|--------|-----------|
| Period filter location | Service writable signal vs **component signal** | Component signal | Period is UI-only state. Service should not know about UI filters. Component derives filtered data via `computed`. |
| Debt trend derivation | New service computed vs **component derived** | Service: `monthlyInstallments` | The raw grouping (installments by month) is reusable for other features. Component filters by period. |
| Export lib | **Inline Blob** vs file-saver | Inline Blob | Zero deps. Angular already has `HttpClient` for MIME handling. CSV/JSON are simple string formats. |
| Chart type: trend | Line vs **bar** | Bar (initially) | Matches the dashboard style. Easy to switch to line later since Chart.js supports type changes. |
| Trend calculation | Compare first/last half vs **previous equal-length period** | Previous equal-length period | More accurate trend signal. If 6m selected, compare first 3m vs last 3m recovery rates. |

## Data Flow

```
DebtStateService
  ├── installments() ─────────────────────────────┐
  ├── payments() ─────────────────────────────────┤
  ├── persons() ──────────────────────────────────┤
  ├── debtByPerson() (existing) ──────────────────┤
  ├── recoveryRate() (existing) ──────────────────┤
  │                                                 │
  │              NEW computed signals               │
  ├── monthlyInstallments() ───────────────────────┤
  │   Map<"YYYY-MM", { total: number, paid: number }> │
  ├── paidByPerson() ──────────────────────────────┤
  │   Record<personId, cents>                     │
  └── personsWithPaid() ──────────────────────────┤
      { ...person, owed: cents, paid: cents }[]   │
                                                    ↓
                    ReportsComponent
  ┌────────────────────────────────────────────────┐
  │  period = signal<'6m' | '1y' | 'all'>('6m')   │
  │                                                │
  │  filteredTrend = computed(() =>                │
  │    filterByPeriod(monthlyInstallments, period))│
  │                                                │
  │  debtTrendChart ← Chart.js (bar, canvas)       │
  │  personChart ← Chart.js (grouped bar, canvas)  │
  │  distributionChart ← Chart.js (doughnut, canvas)│
  │                                                │
  │  recoveryWithTrend = computed(() => {           │
  │    rate: recoveryRate(),                        │
  │    trend: comparePeriods(period) ↑ ↓ →         │
  │  })                                            │
  │                                                │
  │  exportCSV() → Blob + download                  │
  │  exportJSON() → Blob + download                 │
  └────────────────────────────────────────────────┘
```

## New Signals in DebtStateService

```typescript
// src/app/core/services/debt-state.service.ts

/** Installments grouped by month key "YYYY-MM" */
monthlyInstallments = computed(() => {
  const map = new Map<string, { total: number; paid: number }>();
  this.installments().forEach(i => {
    const key = this.toMonthKey(i.dueDate);
    const entry = map.get(key) || { total: 0, paid: 0 };
    entry.total += i.amountCents;
    entry.paid += i.amountPaidCents;
    map.set(key, entry);
  });
  return map;
});

/** Total paid amount per person */
paidByPerson = computed(() => {
  const paid: Record<string, number> = {};
  this.payments().forEach(p => {
    paid[p.personId] = (paid[p.personId] || 0) + p.amountCents;
  });
  return paid;
});

/** Persons enriched with owed and paid amounts */
personsWithPaid = computed(() => {
  const paid = this.paidByPerson();
  const balances = this.debtByPerson();
  return this.persons().map(p => ({
    ...p,
    owed: (p.id in balances) ? balances[p.id] : 0,
    paid: (p.id in paid) ? paid[p.id] : 0,
    totalInstallments: (balances[p.id] || 0) + (paid[p.id] || 0),
  }));
});
```

## Component Structure

```
src/app/features/reports/
├── reports.component.ts        ← Component + signals + chart init + export
├── reports.component.html      ← Template (period nav, chart canvases, export buttons)
├── reports.component.css       ← Layout + responsive overrides
└── reports.component.spec.ts   ← Tests
```

## Key Signals (Component)

```typescript
type Period = '6m' | '1y' | 'all';
type Trend = 'up' | 'down' | 'flat';

period = signal<Period>('6m');

// Filter monthly data by selected period
filteredTrend = computed(() => {
  const all = this.state.monthlyInstallments();
  const months = this.getPeriodMonths();
  // returns sorted array of { label, total, paid } for visible months
});

recoveryWithTrend = computed(() => ({
  rate: this.state.recoveryRate(),
  trend: this.calculateTrend(),
}));

private calculateTrend(): Trend {
  const rate = this.state.recoveryRate();
  const prevRate = this.calculatePreviousPeriodRate();
  if (rate > prevRate) return 'up';
  if (rate < prevRate) return 'down';
  return 'flat';
}
```

## Export Implementation

```typescript
exportCSV(): void {
  const data = this.buildExportData();
  const csv = this.toCsv(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deboapp-report-${this.period()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

exportJSON(): void {
  const data = this.buildExportData();
  const blob = new Blob([JSON.stringify(data, null, 2)],
    { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deboapp-report-${this.period()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

## Chart Configurations

| Chart | Type | Dataset A | Dataset B | Canvas ID |
|-------|------|-----------|-----------|-----------|
| Debt Trend | bar | pending per month | — | `debtTrendChart` |
| Per-Person | bar (grouped) | owed per person | paid per person | `personChart` |
| Distribution | doughnut | % per person of total paid | — | `distributionChart` |

All charts use the same responsive options as the dashboard (`responsive: true`, `maintainAspectRatio: false`, height 250px).

## Recovery Rate Trend

Computed by comparing the recovery rate of the **second half** of the selected period against the **first half**:

- 6m: months 4-6 vs months 1-3
- 1y: months 7-12 vs months 1-6
- all: last 50% vs first 50% of total data range

If there's insufficient data for both halves, the trend is `flat`.

## Route

Replace `PlaceholderComponent` with `ReportsComponent` in `app.routes.ts` for path `/reports`.

## Responsive

- Default: charts in 2-column grid (side by side)
- <768px: charts stack to single column
- Period filter: horizontal button group, wraps on small screens

## Key Test Scenarios

1. All three charts render with real data, period filter updates all
2. Empty state: all charts show appropriate empty messages
3. Recovery rate trend: up when current > previous, down when < , flat when equal or insufficient data
4. CSV export: file downloads with correct MIME type and column headers
5. JSON export: file contains `{ period, debtTrend, persons, recoveryRate, totalDebt, totalRecovered }`
6. Responsive: no overflow at 375px, charts stack vertically
7. Period toggle: switching period causes all charts and recovery rate to update
