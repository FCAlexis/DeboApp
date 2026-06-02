# Calendar View Specification

## Purpose

The Calendar View provides a month-grid visualization of all installment due dates. It turns the user's debt schedule into a daily actionable view — showing what's overdue, due soon, and coming up — without requiring any new backend or state logic.

## Requirements

### RF01 — Month Grid

The system MUST render a month grid with 7 columns (Sun–Sat), leading empty cells before the 1st, trailing empty cells after the last day.

- **GIVEN** today is June 1, 2026  
  **WHEN** the calendar loads  
  **THEN** row 1 starts on the correct weekday for June 1
- **GIVEN** the month is February 2026 (28 days)  
  **WHEN** the grid renders  
  **THEN** cells 1–28 exist and cells 29–31 are empty

### RF02 — Installment Markers

Each day cell MUST display a colored marker per pending installment due on that date.

- **GIVEN** 3 installments are due on June 15, 2026  
  **WHEN** viewing June 2026  
  **THEN** the June 15 cell shows exactly 3 markers
- **GIVEN** a day has no pending installments  
  **WHEN** the grid renders  
  **THEN** that cell shows no markers
- **GIVEN** an installment is fully paid  
  **WHEN** the grid renders  
  **THEN** it MUST NOT appear as a marker

### RF03 — Color Coding

Markers MUST be color-coded by due date proximity.

- **GIVEN** today is June 10  
  **WHEN** viewing an installment due June 7  
  **THEN** its marker is red (overdue)
- **GIVEN** today is June 10  
  **WHEN** viewing an installment due June 12  
  **THEN** its marker is orange (due ≤ 3 days)
- **GIVEN** today is June 10  
  **WHEN** viewing an installment due June 20  
  **THEN** its marker is green (future)

### RF04 — Day Detail

Clicking a day MUST expand a detail list of installments due that date.

- **GIVEN** June 15 has 2 pending installments  
  **WHEN** the user clicks June 15  
  **THEN** both entries appear with person name and remaining amount
- **GIVEN** the user clicks an empty day  
  **WHEN** the detail would open  
  **THEN** it shows "Sin vencimientos"

### RF05 — Month Navigation

The calendar MUST provide Previous Month, Next Month, and "Today" buttons.

- **GIVEN** viewing June 2026  
  **WHEN** clicking "Previous"  
  **THEN** the grid shows May 2026
- **GIVEN** viewing May 2026  
  **WHEN** clicking "Today"  
  **THEN** the grid returns to current month
- **GIVEN** navigating to a month with no installments  
  **WHEN** the grid renders  
  **THEN** all cells are empty

### RF06 — Summary Bar

A summary bar MUST show: "X vencidas, Y próximas en los próximos 30 días".

- **GIVEN** 2 overdue and 5 upcoming installments  
  **WHEN** the calendar renders  
  **THEN** the bar reads "2 vencidas, 5 próximas en los próximos 30 días"
- **GIVEN** zero overdue and zero upcoming  
  **WHEN** the calendar renders  
  **THEN** the bar reads "0 vencidas, 0 próximas en los próximos 30 días"

### RF07 — Responsive

The calendar SHALL be usable without horizontal scroll from 320px upward.

- **GIVEN** viewport is 375px  
  **WHEN** the calendar renders  
  **THEN** no overflow occurs and day cells are ≥ 44×44px
- **GIVEN** viewport is 1200px  
  **WHEN** the calendar renders  
  **THEN** the grid fills available width
