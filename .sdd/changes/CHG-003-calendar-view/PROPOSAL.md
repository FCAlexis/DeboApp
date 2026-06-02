# PROPOSAL: Calendar View (CHG-003)

## 🎯 Intent
Replace the `/calendar` placeholder route with a fully functional month-grid calendar that visualizes installment due dates. Users can see at a glance what's overdue, due soon, and coming up — turning the calendar into a daily debt management tool.

## 📦 Scope

### In Scope
1. **Month grid component** — hand-rolled 7-column grid with day cells, no external calendar library
2. **Color-coded markers** — dots/badges per day cell: 🔴 overdue, 🟠 due within 3 days, 🟢 future
3. **Day detail expansion** — click a day to reveal a list of installments with person name and amount
4. **Month navigation** — prev/next month buttons + "Today" reset
5. **Summary bar** — "X vencidas, Y próximas en los próximos 30 días"
6. **Responsive layout** — mobile-first grid that adapts from phone (single column) to desktop (sidebar layout)
7. **Route update** — wire `/calendar` to the new component

### Out of Scope
- Week or agenda view (future enhancement)
- Click-to-pay from the calendar (future)
- Drag-and-drop rescheduling of installments
- Print or export

## 🛠️ Approach
- **Component**: `CalendarComponent` in a new `src/app/features/calendar/` folder
- **Data**: consume `state.allPendingInstallments()`, `state.pendingAlerts()`, `state.installments()` — no new service
- **Grid**: hand-rolled CSS Grid (7 columns × N rows), computed from a signal that derives day cells from the selected month + pending installments
- **Color logic**: derived signal per installment → `overdue | soon | future` status based on `dueDate` vs `today`
- **Navigation**: `signal<Date>` for the displayed month, prev/next adjust by ±1 month
- **Responsive**: inherit dashboard layout (sidebar desktop / bottom-nav mobile), collapse day cells to stacked list on very small screens

## 📂 Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/features/calendar/` | New | Calendar component, template, styles |
| `src/app/app.routes.ts` | Modify | Replace `PlaceholderComponent` with `CalendarComponent` |
| `src/app/features/dashboard/dashboard.component.ts` | Touch | Calendar nav link already exists — no change needed |
| `openspec/specs/calendar-view/spec.md` | New | Full spec for the new calendar-view capability |

## ⚠️ Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Date arithmetic across month boundaries | Low | Use native Date + UTC helpers; test Feb, Dec boundaries |
| Grid alignment with partial first/last weeks | Low | Compute leading/trailing empty cells using `getDay()` |
| Performance with many installments (100+) | Low | Pure computed signals; no re-render unless month changes |

## Rollback Plan
1. Revert `app.routes.ts` to point `/calendar` back to `PlaceholderComponent`.
2. Delete `src/app/features/calendar/` directory.
3. No data migration needed — calendar is read-only over existing state.

## ✅ Success Criteria
- [ ] All pending installments appear on their correct due-date cells in the grid
- [ ] Overdue installments are visually distinct from future ones
- [ ] Clicking a day shows the detail list for that day's installments
- [ ] Navigating months shows correct data for the selected month
- [ ] "Today" button resets to current month
- [ ] Summary bar shows accurate counts
- [ ] Calendar is usable and scroll-free at 375px viewport
