# Proposal: Calendar View (CHG-003)

## Intent
Replace the `/calendar` placeholder with a month-grid calendar that visualizes installment due dates.

## Scope

### In Scope
- Month grid component (hand-rolled CSS Grid, no external lib)
- Color-coded markers (overdue / soon / future)
- Day click → inline detail list
- Month navigation (prev/next/today)
- Summary bar with counts
- Responsive layout

### Out of Scope
- Week/agenda view, click-to-pay, drag-to-reschedule, print/export

## Capabilities

### New Capabilities
- `calendar-view`: Month-grid visualization of installment due dates with color-coded markers and day-level detail

### Modified Capabilities
None

## Approach
Standalone `CalendarComponent` consuming `DebtStateService` signals. Hand-rolled CSS Grid. No new services. Pure computed signal for month grid derivation.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/features/calendar/` | New | Calendar component files |
| `src/app/app.routes.ts` | Modify | Wire `/calendar` to new component |

## Risks
Low — read-only view over existing state. Date arithmetic across month boundaries is the main edge case.

## Rollback Plan
Revert `app.routes.ts`. Delete `calendar/` directory. No data migration.

## Success Criteria
- All pending installments visible on correct due-date cells
- Overdue visually distinct from future
- Day click shows detail
- Navigation works
- Summary bar accurate
- No horizontal scroll at 375px
