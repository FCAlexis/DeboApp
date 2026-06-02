# Design: Calendar View (CHG-003)

## Technical Approach

New standalone `CalendarComponent` at `src/app/features/calendar/`. Uses **`angular-calendar`** (v0.32.x, MIT) with `date-fns` adapter for the month grid. Reads `DebtStateService` directly to derive `CalendarEvent[]`. No new services, no backend changes.

## Architecture Decisions

| Decision | Options | Chosen | Rationale |
|----------|---------|--------|-----------|
| Grid impl | Hand-rolled vs **angular-calendar** | angular-calendar | 2800+ ⭐, mature, standalone, CSS-animated, MIT. Handles grid edge cases, a11y, keyboard nav. <30KB gzipped. |
| Detail panel | Modal vs **inline expand** | Inline expand | Stays in context — angular-calendar has built-in `activeDayIsOpen` |
| Reactivity | ngOnChanges vs **signals** | Signals (computed) | Angular 21 idiom, already in project |

## Data Flow

```
DebtStateService
  ├── installments() ───────────┐
  ├── allPendingInstallments() ──┤
  └── persons() ────────────────┘
                                  ↓
                  CalendarComponent
                    ┌─────────────────────────┐
                    │  viewDate = signal<Date> │
                    │  activeDayIsOpen = bool  │
                    └─────────────────────────┘
                                  ↓
              computed: events = CalendarEvent[]
              (each installment → CalendarEvent with
               color based on overdue/soon/future status)
                                  ↓
              <mwl-calendar-month-view
                [events]="events"
                [viewDate]="viewDate"
                [activeDayIsOpen]="activeDayIsOpen"
                (dayClicked)="onDayClicked()">
```

## Component Structure

```
src/app/features/calendar/
├── calendar.component.ts        ← Component + signals + event mapping
├── calendar.component.html      ← Template (angular-calendar month view)
├── calendar.component.css       ← Custom overrides + responsive
└── calendar.component.spec.ts   ← Tests
```

## Dependencies

- `angular-calendar` ^0.32.x
- `date-fns` ^4.x (peer dep)
- Config in `app.config.ts` via `provideCalendar({ DateAdapter, useFactory: adapterFactory })`

## Events (CalendarEvent mapping)

```typescript
readonly events = computed<CalendarEvent<InstallmentEvent>[]>(() => {
  return this.state.allPendingInstallments().map(inst => ({
    start: inst.dueDate,
    title: `${inst.personName}: $${remaining(inst)}`,
    color: getColor(inst), // overdue→red, soon→amber, future→green
    meta: { ...inst },
  }));
});
```

## Color Strategy

Via `beforeViewRender` CSS class injection on day cells + event `color` property:

| Status | Color | CSS Class |
|--------|-------|-----------|
| overdue | `#ef4444` (red) | `cal-overdue` |
| soon (≤3 days) | `#f59e0b` (amber) | `cal-soon` |
| future | `#22c55e` (green) | `cal-future` |

## Summary Bar

Computed signal: counts overdue and upcoming (next 30 days) installments.

## Responsive

Override angular-calendar CSS vars for mobile cell heights:
- Default: 80px
- <600px: 60px
- <400px: 44px

## Route

Replace `PlaceholderComponent` with `CalendarComponent` in `app.routes.ts` for path `/calendar`.

## Key Test Scenarios

1. Installments → correct CalendarEvent array, colors match status
2. Event derived with overdue/soon/future color
3. Summary counts correct
4. Component renders without crashing empty state
5. Day click toggles activeDayIsOpen
