# SPEC: Responsive UX

**Breakpoints:** Mobile (< 600px) | Tablet (600–1024px) | Desktop (> 1024px)

## Requirements

### RF01 — Global Responsive Variables (styles.css)
The system MUST define CSS custom properties that adapt at each breakpoint: `--space-sm`, `--space-md`, `--space-lg` (spacing scale); `--sidebar-width` (0 mobile, 260px desktop); `--content-max-width` (100% mobile, 1200px desktop).

- **GIVEN** viewport is 375px  
  **WHEN** inspecting `:root` computed styles  
  **THEN** `--sidebar-width` = `0px` and `--space-md` = `0.75rem`
- **GIVEN** viewport is 1400px  
  **WHEN** inspecting `:root`  
  **THEN** `--sidebar-width` = `260px` and `--content-max-width` = `1200px`

### RF02 — Sidebar / Bottom-Nav Toggle (Dashboard)
Bootstrap dead classes (`d-none`, `d-lg-block`, `d-lg-none`) MUST be replaced with CSS media queries. Sidebar visible only on desktop (> 1024px). Bottom-nav visible only on mobile/tablet (≤ 1024px).

- **GIVEN** viewport is 375px  
  **WHEN** inspecting `.sidebar` and `.bottom-nav`  
  **THEN** `.sidebar` = `display: none` AND `.bottom-nav` = `display: flex`
- **GIVEN** viewport is 1200px  
  **WHEN** inspecting sidebar / bottom-nav  
  **THEN** `.sidebar` = `display: block` AND `.bottom-nav` = `display: none`

### RF03 — Touch Targets ≥ 44×44px (All Components)
Every interactive element MUST have a minimum touch target of 44×44px on mobile viewports. Affected elements: `.back-btn` (all 7 screens), `.delete-btn` (Persons), `.action-btn` (PersonDetail), `.nav-link` (Dashboard sidebar), `.bottom-nav-item`.

- **GIVEN** viewport is 375px on Debts screen  
  **WHEN** running `getBoundingClientRect()` on `.back-btn`  
  **THEN** `width ≥ 44` AND `height ≥ 44`
- **GIVEN** viewport is 375px on Persons screen  
  **WHEN** running `getBoundingClientRect()` on `.delete-btn`  
  **THEN** `width ≥ 44` AND `height ≥ 44`

### RF04 — No Horizontal Scroll (All Components)
No component SHALL cause horizontal overflow at any viewport width from 320px upward.

- **GIVEN** viewport is 320px  
  **WHEN** rendering each screen  
  **THEN** `document.documentElement.scrollWidth ≤ window.innerWidth`

### RF05 — Dashboard Grids (Dashboard)
`.stats-grid` and `.charts-grid` SHALL collapse to single column (`1fr`) below 600px.

- **GIVEN** viewport is 375px  
  **WHEN** inspecting `.stats-grid`  
  **THEN** `grid-template-columns` = `1fr`
- **GIVEN** viewport is 375px  
  **WHEN** inspecting `.charts-grid`  
  **THEN** `grid-template-columns` = `1fr`

### RF06 — Summary Grids (Debts, PaymentsList)
`.summary-grid` SHALL use single column below 600px.

- **GIVEN** viewport is 375px on Debts screen  
  **WHEN** inspecting `.summary-grid`  
  **THEN** `grid-template-columns` = `1fr`

### RF07 — Profile Actions (PersonDetail)
`.profile-actions` SHALL stack to `1fr` below 600px.

- **GIVEN** viewport is 375px on PersonDetail  
  **WHEN** inspecting `.profile-actions`  
  **THEN** `grid-template-columns` = `1fr`

### RF08 — Form Rows (Purchase, Persons)
`.row` SHALL stack to single column below 600px.

- **GIVEN** viewport is 375px on Purchase screen  
  **WHEN** inspecting `.row`  
  **THEN** `grid-template-columns` = `1fr`

### RF09 — Backup Actions (Backup)
`.action-item` SHALL use `flex-direction: column` below 600px.

- **GIVEN** viewport is 375px on Backup  
  **WHEN** inspecting `.action-item`  
  **THEN** `flex-direction` = `column`

### RF10 — Notification Positioning (Notification)
`.notification-container` SHALL prevent overflow on viewports < 400px by using full-width or centered positioning.

- **GIVEN** viewport is 375px  
  **WHEN** a notification renders  
  **THEN** its right edge SHALL NOT extend beyond the viewport

### RF11 — Payment Card Padding (Payment)
`.payment-card` and `.receipt-card` SHALL use padding ≤ 1.5rem below 600px.

- **GIVEN** viewport is 375px on Payment screen  
  **WHEN** inspecting `.payment-card`  
  **THEN** `padding` ≤ `1.5rem`

### RF12 — Chart Container Height (Dashboard)
`.chart-container` SHALL reduce from 250px to 180px below 600px.

- **GIVEN** viewport is 375px on Dashboard  
  **WHEN** inspecting `.chart-container`  
  **THEN** `height` = `180px`
