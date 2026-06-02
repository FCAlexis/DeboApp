# DeboApp — Architecture Reference

## Core Principle
**Components NEVER access IndexedDB directly.** All data reads go through `DebtStateService` signals. All writes go through `DebtService` (business logic layer).

## Data Flow
```
LocalDbService (IndexedDB)
      ↓ (load on init)
DebtService (business logic + atomic transactions)
      ↓ (addPerson, addPurchase, registerPayment, deletePerson, etc.)
DebtStateService (signals — source of truth for UI)
      ↓ (computed signals)
Components (read-only via state.persons(), state.installments(), etc.)
```

## Component Map

### Layout
| Component | Route | Responsibility | Reads from DebtStateService |
|-----------|-------|----------------|----------------------------|
| `App` | — | Root shell, initializes data via `DebtService.loadInitialData()` | — |
| `NotificationContainerComponent` | — | Toast/alert overlay | — |

### Feature Components
| Component | Route | Responsibility | Reads from DebtStateService |
|-----------|-------|----------------|----------------------------|
| `DashboardComponent` | `/dashboard` | Summary cards, health status, chart, person list with balances | `pendingAlerts()`, `debtHealth()`, `recoveryRate()`, `totalRecovered()`, `totalDebt()`, `personsWithBalance()`, `installments()`, `persons()` |
| `PersonsComponent` | `/persons` | List of all persons | `persons()` |
| `PersonDetailComponent` | `/person/:id` | Person detail with purchases, installments, payment form | `persons()`, `debtByPerson()`, `purchases()`, `installments()` |
| `PurchaseComponent` | `/purchase` | Form to create purchase + installments | `persons()` |
| `PaymentComponent` | `/payment/:id` | Register payment for a person | `persons()`, `debtByPerson()` |
| `PaymentsListComponent` | `/payments` | Global payment history | `globalPaymentHistory()`, `totalRecovered()`, `payments()` |
| `DebtsComponent` | `/debts` | Global debts list with filter (all/overdue/pending) | `allPendingInstallments()`, `totalDebt()`, `debtHealth()` |
| `CalendarComponent` | `/calendar` | Month grid of installment due dates | `allPendingInstallments()` |
| `BackupComponent` | `/backup` | Export/import JSON backup | — (uses `LocalDbService` directly — see exception below) |

### Placeholder Components
| Component | Route | Responsibility |
|-----------|-------|----------------|
| `PlaceholderComponent` | `/reports`, `/settings`, `/help` | "Coming soon" screen with back button |

## Services
| Service | Responsibility |
|---------|---------------|
| `LocalDbService` | IndexedDB CRUD via Dexie-like API (singleton, injected) |
| `DebtService` | Business logic orchestration: coordinates DB writes + state updates in atomic operations |
| `DebtStateService` | Signal-based state container: source of truth for all UI reads |
| `NotificationService` | Toast notification manager |

## Models (debt.model.ts)
| Model | Key Fields |
|-------|-----------|
| `Person` | `id`, `name`, `closingDay`, `dueDay` |
| `Purchase` | `id`, `personId`, `description`, `totalCents`, `installmentCount`, `createdAt` |
| `Installment` | `id`, `purchaseId`, `personId`, `number`, `amountCents`, `amountPaidCents`, `dueDate` |
| `Payment` | `id`, `personId`, `amountCents`, `paymentDate` |
| `PersonWithBalance` | `Person` + `balance` (computed) |

## Signal Breakdown (DebtStateService)

| Signal | Type | Description |
|--------|------|-------------|
| `persons` | `signal<Person[]>` | Writable source — all persons |
| `purchases` | `signal<Purchase[]>` | Writable source — all purchases |
| `installments` | `signal<Installment[]>` | Writable source — all installments |
| `payments` | `signal<Payment[]>` | Writable source — all payments |
| `totalDebt` | `computed` | Sum of unpaid installment amounts |
| `totalRecovered` | `computed` | Sum of all payments |
| `allPendingInstallments` | `computed` | Unpaid installments enriched with `personName` |
| `globalPaymentHistory` | `computed` | All payments enriched with `personName` |
| `recoveryRate` | `computed` | Percentage of debt paid |
| `debtHealth` | `computed` | `'SANA' \| 'EN RIESGO' \| 'CRÍTICA'` |
| `debtByPerson` | `computed` | `Record<personId, balanceCents>` |
| `personsWithBalance` | `computed` | Persons with computed balance |
| `pendingAlerts` | `computed` | Overdue/critical/warning alerts |

## Data Access Rules
1. ✅ READ via `DebtStateService` signals (e.g. `state.allPendingInstallments()`)
2. ✅ WRITE via `DebtService` methods (which handle DB + state updates atomically)
3. ❌ NEVER call `LocalDbService` directly from a component
4. ❌ NEVER mutate state signals directly from a component
5. ✅ `BackupComponent` is the ONLY exception (uses `LocalDbService.exportData()` / `importData()` directly — authorized for backup feature)

## Adding a New Feature
1. Read state from `DebtStateService` existing signals
2. If you need new data computation, add a new `computed` signal to `DebtStateService`
3. If you need new write operations, add a method to `DebtService` (it handles DB + state)
4. Create the component — it only reads signals and calls service methods

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components) |
| State Management | Signals + computed |
| Storage | IndexedDB via `LocalDbService` |
| Testing | Vitest + jsdom |
| Package Manager | pnpm |
| Styles | Plain CSS with CSS custom properties (dark mode via `prefers-color-scheme`) |
| Calendar | angular-calendar 0.32.2 + date-fns 4.4.0 |
| Charts | Chart.js 4.5.1 (dashboard only) |
