# Reports & Analytics Specification

## Purpose

The Reports page provides a dedicated analytics view with deeper debt insights beyond the dashboard: monthly debt trends, per-person comparisons, payment distribution, recovery rate with trend, period filtering, and data export. All data is derived from existing state — no new backend or schema.

## Requirements

### RF01 — Debt Trend Chart (Deuda en el Tiempo)

The system MUST render a line chart showing outstanding debt balance per month for the selected period.

- **GIVEN** there are installments of $20,000 due in May and $30,000 due in June with no payments
  **WHEN** the period is "Últimos 6 meses" and the chart renders
  **THEN** the May data point is $20,000 and the June data point is $50,000 (cumulative)
- **GIVEN** a month within the period has no installments
  **WHEN** the chart renders
  **THEN** that month SHALL show $0 (not be omitted)
- **GIVEN** all installments for a month are fully paid
  **WHEN** the chart renders
  **THEN** that month SHALL show $0

### RF02 — Per-Person Comparison (Recuperación por Persona)

The system MUST render a grouped bar chart comparing total owed vs total paid for each person.

- **GIVEN** Person A owes $50,000 and has paid $10,000, Person B owes $30,000 and has paid $30,000
  **WHEN** the bar chart renders
  **THEN** Person A shows owed=$50,000 and paid=$10,000, Person B shows owed=$30,000 and paid=$30,000
- **GIVEN** a person has installments but no payments
  **WHEN** the chart renders
  **THEN** their paid bar SHALL show $0
- **GIVEN** a person has payments but no outstanding installments (fully paid)
  **WHEN** the chart renders
  **THEN** their owed bar SHALL show $0

### RF03 — Payment Distribution (Distribución de Pagos)

The system MUST render a doughnut/pie chart showing how total payments distribute across persons.

- **GIVEN** Person A has paid $40,000 and Person B has paid $10,000 out of $50,000 total
  **WHEN** the pie chart renders
  **THEN** Person A SHALL show 80% and Person B 20%
- **GIVEN** no payments have been recorded
  **WHEN** the pie chart renders
  **THEN** it SHALL display an empty state message "Sin pagos registrados"

### RF04 — Period Selector

The system MUST provide a toggle to filter chart data by period: "Últimos 6 meses", "Último año", "Todo".

- **GIVEN** the chart currently shows 6 months of data
  **WHEN** the user selects "Último año"
  **THEN** the charts SHALL update to show 12 months
- **GIVEN** the user selects "Todo"
  **WHEN** the charts render
  **THEN** they SHALL include ALL months with data
- **GIVEN** the period changes
  **WHEN** all visible charts update
  **THEN** the recovery rate SHALL also reflect the new period

### RF05 — Recovery Rate with Trend

The system MUST display the recovery rate as a big percentage number with a trend indicator (up/down/flat compared to the previous period).

- **GIVEN** the current period recovery rate is 40% and the previous period was 30%
  **WHEN** the report loads
  **THEN** it SHALL display "40%" with an upward trend indicator (↑)
- **GIVEN** the current period recovery rate is 25% and the previous period was 35%
  **WHEN** the report loads
  **THEN** it SHALL display "25%" with a downward trend indicator (↓)
- **GIVEN** the current and previous period rates are equal
  **WHEN** the report loads
  **THEN** it SHALL display the rate with a flat indicator (→)
- **GIVEN** there are no installments (recovery rate is 0%)
  **WHEN** the report loads
  **THEN** it SHALL display "0%" with a flat indicator

### RF06 — CSV Export

The system MUST provide a button to download chart data as a CSV file.

- **GIVEN** the user clicks "Exportar CSV"
  **WHEN** the download triggers
  **THEN** a `.csv` file SHALL be downloaded with columns matching the visible chart data
- **GIVEN** there is no data to export
  **WHEN** the user clicks "Exportar CSV"
  **THEN** nothing SHALL be downloaded (no-op or user feedback)

### RF07 — JSON Export

The system MUST provide a button to download all report data as JSON.

- **GIVEN** the user clicks "Exportar JSON"
  **WHEN** the download triggers
  **THEN** a `.json` file SHALL be downloaded containing current period-filtered data
- **GIVEN** the exported JSON
  **WHEN** inspected
  **THEN** it SHALL contain at minimum: `{ period, debtTrend, persons, recoveryRate, totalDebt, totalRecovered }`

### RF08 — Responsive Layout

The page SHALL be usable without horizontal scroll from 320px upward.

- **GIVEN** viewport is 375px wide
  **WHEN** the reports page renders
  **THEN** all charts stack vertically (one per row) with no overflow
- **GIVEN** viewport is 1200px wide
  **WHEN** the reports page renders
  **THEN** charts MAY display in a multi-column grid
