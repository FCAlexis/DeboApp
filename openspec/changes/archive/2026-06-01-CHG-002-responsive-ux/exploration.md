## Exploration: Responsive UX — Full Codebase Audit

### Current State

The app is **Mobile-First by convention but broken in execution.** All components use relative units (`rem`) and CSS custom properties from `:root`. The viewport meta tag is correctly set. However:

- **Zero responsive breakpoints** outside the Dashboard (only 1 `@media` query in the entire codebase)
- **Bootstrap dead classes**: Dashboard uses `d-none`, `d-lg-block`, `d-lg-none` — Bootstrap is NOT installed/loaded. Both sidebar AND bottom-nav render simultaneously on all devices.
- **No global responsive framework**: No CSS variables for breakpoint-based spacing, no responsive grid system, no container queries.

### Components Audit

| Component | Media Queries | Touch Targets | Layout Issues |
|-----------|:---:|:---:|:---:|
| `app.ts` (root) | 0 | N/A | Empty CSS, no layout wrapper |
| Dashboard | 1 (992px) | ❌ sidebar: 40px | Bootstrap dead classes, sidebar+bottom-nav both visible |
| Debts | 0 | ❌ back: 40px | Summary grid hardcoded 2-col |
| Persons | 0 | ❌ delete: 36px, back: 40px | Sticky form breaks on mobile |
| PersonDetail | 0 | ❌ back: 40px | Actions 2-col never stacks |
| Payment | 0 | ❌ back: 40px | Padding too generous for 320px |
| PaymentsList | 0 | ❌ back: 40px | Summary grid hardcoded 2-col |
| Purchase | 0 | ❌ back: 40px | Row fields never stack |
| Backup | 0 | ❌ back: 40px | Action items wrap awkwardly |
| Notification | 0 | ✅ | Fixed top-right overflows on <400px |

### Affected Areas

- `src/app/features/dashboard/dashboard.component.ts` — Entire responsive behavior (sidebar/nav toggle broken)
- `src/app/features/debts/debts.component.ts` — Summary grid, no breakpoints
- `src/app/features/persons/persons.component.ts` — Form layout, delete target, sticky positioning
- `src/app/features/persons/person-detail.component.ts` — Action buttons grid, back btn
- `src/app/features/payments/payment.component.ts` — Card padding, touch targets
- `src/app/features/payments/payments-list.component.ts` — Summary grid, back btn
- `src/app/features/purchases/purchase.component.ts` — Row fields, card padding
- `src/app/features/backup/backup.component.ts` — Action items wrap
- `src/app/core/components/notification-container.component.ts` — Overflow on small screens
- `src/styles.css` — Missing responsive variables, breakpoint definitions
- `angular.json` — May need update for global responsive utilities

### Approaches

1. **CSS Custom Properties + Media Queries (recommended)**
   - Define breakpoint variables in `:root`
   - Add consistent media queries at 600px and 1024px
   - Keep inline styles in components, add media query blocks per component
   - Fix Bootstrap dead classes with proper CSS
   - Pros: No dependencies, direct control, matches existing pattern
   - Cons: Repetitive across components
   - Effort: Medium

2. **Adopt a lightweight utility framework (Tailwind/Open Props)**
   - Install and configure via Angular build
   - Use utility classes for responsive spacing, grids, visibility
   - Pros: Consistent, less CSS to write, proven patterns
   - Cons: Adds dependency, learning curve, overkill for this codebase size
   - Effort: Medium-High

3. **Component-level responsive refactor only**
   - Only fix the broken dashboard sidebar/bottom-nav and add minimal media queries
   - Leave everything else as-is
   - Pros: Minimum effort
   - Cons: Doesn't meet DESIGN.md success criteria (320px to 4K)
   - Effort: Low

### Recommendation

**Approach 1 (CSS Custom Properties + Media Queries)**. The app already has a custom properties pattern in `:root`. The natural evolution is to add:

1. **Breakpoint variables** to `:root`:
   ```css
   --bp-mobile: 600px;
   --bp-tablet: 1024px;
   ```

2. **Spacing scale variables** that change at breakpoints:
   ```css
   --space-sm: 0.5rem;   /* mobile */
   --space-md: 1rem;      /* mobile */
   --space-lg: 1.5rem;    /* mobile */
   /* tablet/desktop overrides via media queries */
   ```

3. **Fix the dead Bootstrap classes** — replace with proper CSS or custom utility classes.

4. **Per-component media queries** at 600px and 1024px, focusing on:
   - Grid layouts collapsing to single column on mobile
   - Touch targets scaling to 44x44px minimum
   - Sidebar/bottom-nav toggling correctly
   - Content max-width for desktop readability
   - Notification repositioning on mobile

### Risks

- **Risk 1**: Retro-fitting responsive into a codebase built mobile-first-but-broken means every component needs individual attention. Miss one, and it breaks at an edge case.
- **Risk 2**: The dashboard sidebar/nav bug (Bootstrap dead classes) is critical for UX but easy to fix once discovered.
- **Risk 3**: Notification container positioned `fixed` top-right will overflow on <400px screens — needs repositioning or full-width on mobile.
- **Risk 4**: Chart.js canvas (250px fixed height) may need responsive height adjustment on mobile.

### Ready for Proposal

Yes. The exploration found concrete, actionable issues across ALL 9 components. The DESIGN.md intent is sound but severely underimplemented. The proposal should:
1. Fix the dead Bootstrap classes (CRITICAL, cheap)
2. Add global responsive CSS custom properties (foundational)
3. Add consistent media queries to all components (bulk of work)
4. Fix touch targets (mechanical, high-value)
5. Fix notification positioning on mobile (edge case, small effort)
