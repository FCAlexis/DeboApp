# Tasks: Calendar View (CHG-003)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~280 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

> **Note**: `strict_tdd: true` in config — tasks 2.1–2.2 are RED→GREEN pairs.

## Phase 1: Foundation

- [ ] 1.1 `pnpm add angular-calendar date-fns` — install dependencies
- [ ] 1.2 `app.config.ts` — add `provideCalendar({ provide: DateAdapter, useFactory: adapterFactory })` imported from `angular-calendar/date-adapters/date-fns`

## Phase 2: Component (TDD)

- [ ] 2.1 (RED) Test: pending installments map to `CalendarEvent[]` with correct `start`, `title`, `color` (overdue→red, ≤3d→amber, future→green), `meta`; fully paid filtered out
- [ ] 2.1 (GREEN) Create `calendar.component.ts` — `viewDate`/`activeDayIsOpen` signals, `events` computed (installments→events), `summaryText` computed, `onDayClicked` toggle, `onBeforeRender` for CSS class injection
- [ ] 2.2 (RED) Test: summary bar — 2 overdue + 3 within 30 days → `"2 vencidas, 3 próximas en los próximos 30 días"`; zero-case → `"0 vencidas, 0 próximas en los próximos 30 días"`
- [ ] 2.2 (GREEN) Create `calendar.component.html` — nav (prev/next/today), summary bar, `<mwl-calendar-month-view>` with event/day-click/beforeViewRender bindings, `weekStartsOn="1"`
- [ ] 2.3 Create `calendar.component.css` — day cell background tints (`.cal-overdue`/`.cal-soon`/`.cal-future`), nav layout, responsive cell heights via `--cal-cell-height` at 600px/400px

## Phase 3: Integration

- [ ] 3.1 `app.routes.ts` — replace `PlaceholderComponent` with `CalendarComponent` for path `'calendar'`

## Phase 4: Component Tests

- [ ] 4.1 Test: day click toggles `activeDayIsOpen`; clicking empty day shows "Sin vencimientos"
- [ ] 4.2 Test: prev/next/today buttons update `viewDate` correctly
- [ ] 4.3 Verify responsive: 375px no overflow, day cells ≥ 44×44px
