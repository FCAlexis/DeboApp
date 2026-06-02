# DESIGN: Cimientos y Flujo Básico de Datos (CHG-001)

## 🏗️ Arquitectura de Software

### 1. Flujo de Datos (Data Flow)
`UI Component` $\rightarrow$ `DebtService (Action)` $\rightarrow$ `LocalDbService (Persistence)` $\rightarrow$ `DebtStateService (Signal Update)` $\rightarrow$ `UI Component (Reactive Render)`

### 2. Definición de la Base de Datos Local (IndexedDB)
Se crearán los siguientes Object Stores (tablas):
- `persons`: `{ id: UUID, name: string, ... }`
- `cards`: `{ id: UUID, personId: UUID, name: string, closingDay: number, dueDay: number }`
- `purchases`: `{ id: UUID, cardId: UUID, personId: UUID, description: string, totalCents: number, installmentCount: number }`
- `installments`: `{ id: UUID, purchaseId: UUID, personId: UUID, amountCents: number, dueDate: Date }`
- `payments`: `{ id: UUID, personId: UUID, amountCents: number, paymentDate: Date }`

### 3. Modelo de Estado (Angular Signals)
- `persons = signal<Person[]>([])`
- `cards = signal<Card[]>([])`
- `purchases = signal<Purchase[]>([])`
- `installments = signal<Installment[]>([])`
- `payments = signal<Payment[]>([])`

#### Computed Signals
- `totalDebt = computed(() => ...)` $\rightarrow$ Suma de cuotas pendientes - pagos.
- `debtByPerson = computed(() => ...)` $\rightarrow$ Mapa de saldos por persona.
- `personsWithBalance = computed(() => ...)` $\rightarrow$ Lista de personas con su saldo actual.

---

## 📂 Estructura de Componentes (Angular 21)
- `DashboardComponent`: Vista de resúmenes globales y saldos por persona.
- `PersonFormComponent`: Creación de personas y sus tarjetas asociadas.
- `PurchaseFormComponent`: Registro de compra asociado a una tarjeta específica.

---

## 🛠️ Firma de Métodos (API Interna)

### `DebtService`
- `async addPerson(name: string, cards: Card[]): Promise<void>`
- `async addPurchase(cardId: string, description: string, totalCents: number, installments: number): Promise<void>`
- `private calculateActualDueDate(purchaseDate: Date, card: Card, installmentNumber: number): Date`
