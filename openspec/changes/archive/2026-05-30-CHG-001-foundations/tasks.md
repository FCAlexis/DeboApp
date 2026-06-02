# Tasks: Cimientos y Flujo Básico de Datos (CHG-001)

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

## Phase 1: Infrastructure & Persistence

- [x] **T1.1**: Angular 21 standalone project scaffolded — `core/`, `features/`, `shared/` dirs created, app.config, routes, SSR config
- [x] **T1.2**: `LocalDbService` — `getAll<T>`, `put`, `delete`, `clearAll`, `exportData`, `importData` on stores `[persons, purchases, installments, payments]`
- [x] **T1.3**: Persistence verification test (IndexedDB save/read/reload cycle)

### Not originally listed (now implemented in Phase 1)
- [x] **T1.4**: `debt.model.ts` — Person, Purchase, Installment, Payment, PersonWithBalance interfaces
- [x] **T1.5**: `NotificationService` + `NotificationContainerComponent` — signal-based toast system
- [x] **T1.6**: `PlaceholderComponent` — route placeholder for future features

## Phase 2: State & Business Logic

- [x] **T2.1**: `DebtStateService` — writable signals for 4 entities + computed: `totalDebt`, `debtByPerson`, `personsWithBalance`, `totalRecovered`, `recoveryRate`, `debtHealth`, `allPendingInstallments`, `globalPaymentHistory`, `pendingAlerts`
- [x] **T2.2**: `DebtService` — `addPerson`, `addPersonExtended`, `deletePerson`, `addPurchase`, `registerPayment`, `loadInitialData`
- [x] **T2.3**: `PaymentEngine.distribuirPago` — priority-based greedy distribution (overdue first, then oldest, adjustments before installments)

### Not originally listed (now implemented in Phase 2)
- [x] **T2.4**: `CycleEngine` — `calculateClosingDate`, `calculateDueDate`, `generateDates` for credit card cycle math

## Phase 3: UI

- [x] **T3.1**: `DashboardComponent` — stats cards, health indicator, recovery rate, charts (Chart.js), alerts, sidebar & mobile nav, next payment widget
- [x] **T3.2**: `PersonsComponent` — create/list/delete persons with closing/due day config
- [x] **T3.3**: `PurchaseComponent` — person select, description, amount, installment count, saves via DebtService
- [x] **T3.4**: `AppComponent` — router outlet + NotificationContainer, loads initial data on init
- [x] **T3.5**: Full routing setup — `/dashboard`, `/persons`, `/person/:id`, `/purchase`, `/payment/:id`, `/debts`, `/payments`, `/backup`, `/calendar`, `/reports`, `/settings`, `/help`

### Not originally listed (now implemented in Phase 3)
- [x] **T3.6**: `PersonDetailComponent` — profile card, installment timeline (status badges), purchase history
- [x] **T3.7**: `DebtsComponent` — global debts view with ALL/OVERDUE/PENDING filters
- [x] **T3.8**: `PaymentComponent` — per-person payment form with receipt showing allocation breakdown
- [x] **T3.9**: `PaymentsListComponent` — global payment history with search/filter
- [x] **T3.10**: `BackupComponent` — export/import IndexedDB via JSON file

## Phase 4: Tests

- [x] **T4.1**: `PaymentEngine` unit tests — basic payment, partial, cascade, overdue prioritization, zero/negative validation (5 tests in `payment-engine.spec.ts`)
- [x] **T4.2**: App smoke test — component creation + title render (`app.spec.ts`)
- [x] **T4.3**: `DebtStateService` tests — 16 tests: signal initial state, computed derivations (`totalDebt`, `debtByPerson`, `debtHealth`, `pendingAlerts`, `recoveryRate`, `personsWithBalance`), mutations
- [x] **T4.4**: `DebtService` unit tests — `addPersonExtended` + `deletePerson` cascade (DB + signal sync)
- [x] **T4.5**: `DebtService.addPurchase` test — installment generation with correct remainder distribution (SPEC Case 1: $100,000 in 3 cuotas)
- [x] **T4.6**: `DebtService.registerPayment` test — payment distribution on installments, verify `amountPaidCents` update, cascade excess
- [x] **T4.7**: `CycleEngine` unit tests — 11 tests: `calculateClosingDate`, `calculateDueDate`, `generateDates` edge cases (month clamping, year boundary)
- [x] **T4.8**: `LocalDbService` tests — 7 tests: `put`/`getAll`/`delete`/`clearAll` cycle, `exportData`/`importData` roundtrip
- [x] **T4.9**: `DashboardComponent` test — 13 tests: computed signals (overdueTotal, overdueCount, comingSoonTotal, nextPayment), formatCurrency, navigation methods
- [x] **T4.10**: Component smoke tests — `PersonsComponent` (6t), `PurchaseComponent` (4t), `DebtsComponent` (12t), `PersonDetailComponent` (11t), `PaymentComponent` (11t), `BackupComponent` (8t), `PaymentsListComponent` (11t) — all create and render via DI without TestBed
