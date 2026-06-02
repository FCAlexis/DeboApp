# DESIGN: Calendar View (CHG-003)

## Technical Approach

New standalone `CalendarComponent` at `src/app/features/calendar/`. Uses **`angular-calendar`** (v0.32.x, MIT) with `date-fns` adapter for the month grid. Reads `DebtStateService` directly to derive `CalendarEvent[]`. No new services, no backend changes.

## Architecture Decisions

### Decision: Hand-rolled grid vs. calendar library
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Hand-rolled CSS Grid | ~300 lines custom code, manual edge cases (Feb 28, month boundaries, leap years) | ❌ |
| **angular-calendar** | 2800+ ⭐, mature, standalone, CSS-animated, MIT, ng add | ✅ |
| **Rationale**: angular-calendar handles all grid edge cases, has proper accessibility (keyboard nav, ARIA), CSS animations, and custom templates (`cellTemplate`). The bundle is <30KB gzipped and we only use month view. No reason to reinvent a calendar grid. |

### Decision: Inline detail panel vs. modal/dialog
| Option | Tradeoff | Decision |
|--------|----------|----------|
| Modal dialog | Blocks view, requires overlays | ❌ |
| **Inline expand below day cell** | Stays in context, simple signal state | ✅ |
| Side panel (desktop) | Responsive complexity | ❌ |
| **Rationale**: angular-calendar has built-in `activeDayIsOpen` which shows an expandable event list below the day when clicked. We use this with a custom `openDayEventsTemplate`. |

### Decision: Event derivation
| Option | Tradeoff | Decision |
|--------|----------|----------|
| `computed(() => toCalendarEvents(...))` | Reactive, idiomatic Angular 21 signals | ✅ |
| Manual event building | More imperative | ❌ |
| **Rationale**: Transform `Installment[]` → `CalendarEvent[]` in a `computed()`. Same pattern as the existing codebase. |

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
                (dayClicked)="onDayClicked()"
                [cellTemplate]="customCell">
```

## Component Structure

```
src/app/features/calendar/
├── calendar.component.ts        ← Component class + signals + event mapping
├── calendar.component.html      ← Template (angular-calendar month view)
├── calendar.component.css       ← Custom styles overrides + responsive
└── calendar.component.spec.ts   ← Unit tests
```

### Provide calendar (app.config.ts)

Add to `app.config.ts`:
```typescript
import { provideCalendar, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...existing providers
    provideCalendar({
      provide: DateAdapter,
      useFactory: adapterFactory,
    }),
  ],
};
```

### Signals & Events

```typescript
readonly viewDate = signal<Date>(new Date());
readonly activeDayIsOpen = signal(false);

// Derive CalendarEvent[] from installments
readonly events = computed<CalendarEvent<InstallmentEvent>[]>(() => {
  return this.state.allPendingInstallments().map(inst => {
    const diff = (inst.dueDate.getTime() - Date.now()) / DAY_MS;
    const color = diff < 0
      ? OVERDUE_COLOR    // overdue → red
      : diff <= 3
        ? SOON_COLOR     // soon → amber
        : FUTURE_COLOR;  // future → green

    return {
      start: inst.dueDate,
      title: `${inst.personName}: $${formatCurrency(inst.amountCents - inst.amountPaidCents)}`,
      color,
      meta: { personId: inst.personId, personName: inst.personName, ...inst },
    };
  });
});
```

### Template Outline

```html
<!-- Navigation Header -->
<div class="cal-nav">
  <button (click)="viewDate.set(subMonths(viewDate(), 1))">‹</button>
  <h2>{{ viewDate() | calendarDate:'monthViewTitle':'es' }}</h2>
  <button (click)="viewDate.set(addMonths(viewDate(), 1))">›</button>
  <button class="btn-today" (click)="viewDate.set(new Date())">Hoy</button>
</div>

<!-- Summary Bar -->
<div class="cal-summary">{{ summaryText() }}</div>

<!-- Month Grid -->
<mwl-calendar-month-view
  [viewDate]="viewDate()"
  [events]="events()"
  [activeDayIsOpen]="activeDayIsOpen()"
  [weekStartsOn]="1"
  (dayClicked)="onDayClicked($event)"
  (beforeViewRender)="onBeforeRender($event)">
</mwl-calendar-month-view>
```

### Custom Day Cell (via beforeViewRender)

Use `beforeViewRender` to inject the overdue/soon/future CSS class to each day cell:

```typescript
onBeforeRender(event: CalendarMonthViewBeforeRenderEvent): void {
  event.body.forEach(day => {
    const worst = day.events.reduce<Status | null>((w, e) => {
      const s = (e.meta?.status as Status);
      if (s === 'overdue') return 'overdue';
      if (s === 'soon' && w !== 'overdue') return 'soon';
      return w ?? 'future';
    }, null);
    if (worst) day.cssClass = `cal-${worst}`;
  });
}
```

### CSS Strategy

Minimal custom CSS — most styling comes from angular-calendar's built-in classes:

```css
/* Custom color overrides for event badges */
.cal-overdue .cal-cell-top { background: rgba(239, 68, 68, 0.1); }
.cal-soon    .cal-cell-top { background: rgba(245, 158, 11, 0.1); }
.cal-future  .cal-cell-top { background: rgba(34, 197, 94, 0.1); }

/* Navigation */
.cal-nav { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.cal-nav h2 { flex: 1; margin: 0; font-size: 1.25rem; }

/* Summary bar */
.cal-summary {
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 0.9rem;
  background: var(--surface-card);
}

/* Responsive: angular-calendar already handles mobile well via CSS vars.
   Override cell heights for smaller screens. */
@media (max-width: 600px) {
  :host { --cal-cell-height: 60px; }
}
@media (max-width: 400px) {
  :host { --cal-cell-height: 44px; }
}
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/features/calendar/calendar.component.ts` | Create | Calendar component with angular-calendar integration |
| `src/app/features/calendar/calendar.component.html` | Create | Template with month view, nav, summary |
| `src/app/features/calendar/calendar.component.css` | Create | Custom overrides + responsive |
| `src/app/features/calendar/calendar.component.spec.ts` | Create | Unit tests |
| `src/app/app.routes.ts` | Modify | Replace `PlaceholderComponent` with `CalendarComponent` for `/calendar` |
| `src/app/app.config.ts` | Modify | Add `provideCalendar` with date-fns adapter |
| `package.json` | Modify | Add `angular-calendar` + `date-fns` |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Event derivation | Installments → correct `CalendarEvent[]` shape, color mapping based on status |
| Unit | Summary counts | Test with mixed installments → correct "X vencidas, Y próximas" |
| Component | Month navigation | Click prev/next/today buttons, assert viewDate changes |
| Component | Day click → detail | Click a day with events, assert `activeDayIsOpen` toggles |
| Visual | Responsive | Verify no horizontal overflow at 375px/320px |

## Open Questions

- [ ] Locale: angular-calendar supports `locale` input via `date-fns` locales. Use `es` for Spanish month/day names.
