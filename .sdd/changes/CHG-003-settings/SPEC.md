# Settings Page Specification

## Purpose

The Settings page gives users control over app-level preferences: currency, default billing cycle days, and data management. A new `SettingsService` stores values in `localStorage` and exposes them as signals so all components react to changes in real time.

## Requirements

### Shared Utility — formatCurrency

#### RQ-FMT-01 — Shared formatCurrency function

The system MUST provide a shared `formatCurrency(cents: number, currency: string): string` pure function in `src/app/core/utils/format-currency.ts`.

- **GIVEN** `cents = 123456` and `currency = 'ARS'`
  **WHEN** `formatCurrency(123456, 'ARS')` is called
  **THEN** it SHALL return a string containing `1.234`
- **GIVEN** `cents = 0` and `currency = 'USD'`
  **WHEN** `formatCurrency(0, 'USD')` is called
  **THEN** it SHALL return a string containing `0`
- **GIVEN** `cents = 5000` and `currency = 'EUR'`
  **WHEN** `formatCurrency(5000, 'EUR')` is called
  **THEN** it SHALL return a string containing `50`
- **GIVEN** an unknown currency code
  **WHEN** `formatCurrency(1000, 'XXX')` is called
  **THEN** the function SHOULD fall back to the default locale formatter without throwing

#### RQ-FMT-02 — Components use shared function

All 5 components (dashboard, payment, person-detail, payments-list, debts) MUST import and call `formatCurrency` from the shared utility instead of their inline method.

- **GIVEN** a component previously had `formatCurrency()` as a class method
  **WHEN** the component renders a currency value
  **THEN** it SHALL use the imported function with the currency from `SettingsService` (or a fallback)

### SettingsService

#### RQ-SET-01 — Persisted settings with defaults

The system MUST provide a `SettingsService` that stores settings in `localStorage` under the key `deboapp-settings` and exposes them as signals.

- **GIVEN** the app loads with no prior settings in localStorage
  **WHEN** `SettingsService` is constructed
  **THEN** default values SHALL be: `{ currency: 'ARS', defaultClosingDay: 15, defaultDueDay: 5 }`
- **GIVEN** settings exist in localStorage
  **WHEN** `SettingsService` is constructed
  **THEN** it SHALL restore those values
- **GIVEN** a setting value changes
  **WHEN** `updateSetting(key, value)` is called
  **THEN** the corresponding signal SHALL update AND localStorage SHALL be written synchronously

#### RQ-SET-02 — resetDefaults

The system MUST provide a `resetDefaults()` method that restores factory defaults.

- **GIVEN** the user has changed currency to `USD`
  **WHEN** `resetDefaults()` is called
  **THEN** `currency` SHALL return to `'ARS'`, `defaultClosingDay` to `15`, `defaultDueDay` to `5`

### Settings Page

#### RQ-PAGE-01 — Currency selector

The settings page MUST show the current currency and allow changing it to ARS, USD, or EUR.

- **GIVEN** the settings page renders
  **WHEN** the user selects `EUR` from the currency dropdown
  **THEN** `SettingsService.currency` SHALL be updated to `'EUR'`
- **GIVEN** the currency changes
  **WHEN** any component calls `formatCurrency()` via the shared utility
  **THEN** it SHALL use the selected currency from `SettingsService`

#### RQ-PAGE-02 — Default closing day control

The settings page MUST provide a control to set the default closing day (1-31).

- **GIVEN** the user sets default closing day to `20`
  **WHEN** the user opens the new person form
  **THEN** `closingDay` SHALL default to `20`
- **GIVEN** the user enters a value outside 1-31
  **WHEN** the control validates
  **THEN** it SHALL clamp to the nearest valid value

#### RQ-PAGE-03 — Default due day control

The settings page MUST provide a control to set the default due day (1-31).

- **GIVEN** the user sets default due day to `10`
  **WHEN** the user opens the new person form
  **THEN** `dueDay` SHALL default to `10`
- **GIVEN** the user enters a value outside 1-31
  **WHEN** the control validates
  **THEN** it SHALL clamp to the nearest valid value

#### RQ-PAGE-04 — Delete all data

The settings page MUST provide a "Delete all data" button with a confirmation dialog.

- **GIVEN** the user clicks "Delete all data"
  **WHEN** confirmation is requested but the user cancels
  **THEN** no data SHALL be deleted
- **GIVEN** the user confirms deletion
  **WHEN** the delete operation completes
  **THEN** all records in IndexedDB SHALL be removed, settings SHALL remain intact, and a success toast SHALL appear

#### RQ-PAGE-05 — Export and Import

The settings page MUST provide buttons that reuse the existing backup export/import functionality.

- **GIVEN** the user clicks "Export data"
  **WHEN** the action triggers
  **THEN** a `.json` backup file SHALL be downloaded containing all app data
- **GIVEN** the user clicks "Import data"
  **WHEN** a valid backup file is selected
  **THEN** the data SHALL be imported replacing all current data

#### RQ-PAGE-06 — About section

The settings page MUST display an About section with the app name and version.

- **GIVEN** the settings page renders
  **WHEN** the user scrolls to the About section
  **THEN** it SHALL display "DeboApp" and the version from `package.json`

#### RQ-PAGE-07 — Responsive layout

The settings page SHALL be usable without horizontal scroll from 320px upward.

- **GIVEN** the viewport is 320px wide
  **WHEN** the settings page renders
  **THEN** all controls SHALL be fully visible with no overflow
- **GIVEN** the viewport is 768px or wider
  **WHEN** the settings page renders
  **THEN** controls MAY display in a wider single-column layout with more whitespace

### PersonsComponent — Dynamic Defaults

#### RQ-PERS-01 — Default days from SettingsService

PersonsComponent MUST read `defaultClosingDay` and `defaultDueDay` from `SettingsService` instead of hardcoded values.

- **GIVEN** the user set `defaultClosingDay: 20` and `defaultDueDay: 10` in settings
  **WHEN** the user opens the new person form
  **THEN** `closingDay` SHALL default to `20` and `dueDay` to `10`
- **GIVEN** the user changes defaults while the form is empty
  **WHEN** the form re-renders
  **THEN** the default values SHALL update reactively (via signal)
