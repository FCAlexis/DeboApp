# Tasks: Responsive UX

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~130-160 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Foundation — styles.css

- [x] 1.1 Add `--bp-mobile: 600px; --bp-tablet: 1024px`, responsive spacing scale (`--space-sm/md/lg`), `--sidebar-width: 0` with desktop override, `--content-max-width` to `:root` in `src/styles.css` (RF01)

## Phase 2: Dashboard — critical Bootstrap fix + responsive rules

- [x] 2.1 Remove `d-none`, `d-lg-block`, `d-lg-none` from template; add `@media` queries hiding `.sidebar` / showing `.bottom-nav` below 1024px (RF02)
- [x] 2.2 Collapse `.stats-grid` and `.charts-grid` to `1fr` below 600px (RF05)
- [x] 2.3 Override `.chart-container` to `height: 180px` below 600px (RF12)
- [x] 2.4 Increase `.btn-icon` to `min-width: 44px; min-height: 44px` on mobile (RF03)

## Phase 3: Detail screens — Debts, PaymentsList, PersonDetail

- [x] 3.1 Collapse `.summary-grid` to `1fr` below 600px in Debts and PaymentsList (RF06)
- [x] 3.2 Collapse `.profile-actions` to `1fr` below 600px in PersonDetail (RF07)
- [x] 3.3 Increase `.back-btn` to `min-width: 44px; min-height: 44px` in Debts, PaymentsList, PersonDetail (RF03)

## Phase 4: Forms & actions — Persons, Purchase, Backup

- [x] 4.1 Collapse `.row` (form fields) to `1fr` below 600px in Persons and Purchase (RF08)
- [x] 4.2 Switch `.action-item` to `flex-direction: column` below 600px in Backup (RF09)
- [x] 4.3 Increase `.delete-btn` to `min-width: 44px; min-height: 44px` in Persons; bump `.back-btn` in Persons, Purchase, Backup (RF03)

## Phase 5: Edge cases — Payment, Notification

- [x] 5.1 Cap `.payment-card` / `.receipt-card` padding to `1.5rem` below 600px (RF11)
- [x] 5.2 Reposition `.notification-container` to full-width centered below 400px (RF10)

## Phase 6: Testing

- [x] 6.1 Write Vitest unit tests validating responsive CSS per RF scenario (file-content regex approach per design decision — JSDOM cannot evaluate CSS media queries)
- [x] 6.2 Verify no horizontal scroll at 320px viewport (RF04 — Playwright check: Dashboard, Debts, Persons, Payments, Backup all LOCKED after html/body overflow-x: hidden)
