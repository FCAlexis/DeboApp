# SPEC: Calendar View (CHG-003)

## RF01 — Month Grid Display

A month grid MUST render 7 columns (Sun–Sat) with leading empty cells for days before the 1st and trailing empty cells for days after the last.

- **GIVEN** today is June 1, 2026  
  **WHEN** the calendar loads  
  **THEN** row 1 begins on the correct weekday column for June 1, with empty cells for May 31 and earlier
- **GIVEN** the current month is February 2026 (28 days)  
  **WHEN** the grid renders  
  **THEN** day cells 1–28 are present and cells 29–31 are empty

## RF02 — Installment Markers

Each day cell MUST show a colored marker for each pending installment due on that date.

- **GIVEN** 3 installments are due on June 15, 2026  
  **WHEN** viewing June 2026  
  **THEN** the June 15 cell displays exactly 3 markers
- **GIVEN** a day has no pending installments  
  **WHEN** viewing that month  
  **THEN** the day cell shows no markers

## RF03 — Color Coding

Markers MUST be color-coded: 🔴 overdue (past due), 🟠 due within 3 days, 🟢 due in 4+ days.

- **GIVEN** today is June 10, 2026  
  **WHEN** viewing an installment due June 7  
  **THEN** its marker is red (overdue)
- **GIVEN** today is June 10, 2026  
  **WHEN** viewing an installment due June 12  
  **THEN** its marker is orange (due within 3 days)
- **GIVEN** today is June 10, 2026  
  **WHEN** viewing an installment due June 20  
  **THEN** its marker is green (future)
- **GIVEN** an installment has been fully paid (`amountPaidCents >= amountCents`)  
  **WHEN** the grid renders  
  **THEN** it MUST NOT appear as a marker

## RF04 — Day Click Details

Clicking a day cell MUST expand/show a detail panel listing each installment due that day with person name and remaining amount.

- **GIVEN** June 15 has 2 pending installments ($5,000 and $3,000)  
  **WHEN** the user clicks the June 15 cell  
  **THEN** a detail panel shows both entries with person names and amounts
- **GIVEN** the user clicks an empty day (no installments)  
  **WHEN** the detail panel would open  
  **THEN** it shows "Sin vencimientos" or nothing

## RF05 — Month Navigation

The calendar MUST provide Previous Month, Next Month, and "Today" controls.

- **GIVEN** the user is viewing June 2026  
  **WHEN** clicking "Previous"  
  **THEN** the grid displays May 2026 and markers update
- **GIVEN** the user is viewing May 2026  
  **WHEN** clicking "Today"  
  **THEN** the grid returns to June 2026
- **GIVEN** the user is viewing June 2026  
  **WHEN** clicking "Next"  
  **THEN** the grid displays July 2026
- **GIVEN** the user navigates to a month with no installments  
  **WHEN** the grid renders  
  **THEN** all day cells are empty (no markers)

## RF06 — Summary Bar

A summary bar below the month header MUST display: "X vencidas, Y próximas en los próximos 30 días".

- **GIVEN** there are 2 overdue installments and 5 due within 30 days  
  **WHEN** the calendar renders  
  **THEN** the summary bar reads "2 vencidas, 5 próximas en los próximos 30 días"
- **GIVEN** there are 0 overdue and 0 upcoming installments  
  **WHEN** the calendar renders  
  **THEN** the summary bar reads "0 vencidas, 0 próximas en los próximos 30 días"

## RF07 — Responsive Layout

The calendar SHALL be usable without horizontal scroll on viewports from 320px upward.

- **GIVEN** viewport is 375px  
  **WHEN** the calendar renders  
  **THEN** no horizontal overflow occurs and day cells remain tappable (≥ 44×44px)
- **GIVEN** viewport is 1200px  
  **WHEN** the calendar renders  
  **THEN** the grid fills available width with comfortable cell spacing
