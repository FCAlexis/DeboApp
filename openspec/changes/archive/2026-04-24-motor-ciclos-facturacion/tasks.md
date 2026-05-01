# Tasks: Implementación de Motor de Ciclos de Facturación

## Phase 1: Foundation & Data Models

- [ ] 1.1 Update `Person` interface in `ui/src/app/core/debt-state.service.ts` to include `closingDay: number` and `dueDay: number`.
- [ ] 1.2 Implement `CycleEngine` class structure in `ui/src/app/core/cycle-engine.ts` with static method signatures.
- [ ] 1.3 Update `Person` creation logic in `DebtService.addPerson` to provide default values for `closingDay` (15) and `dueDay` (5).

## Phase 2: Core Logic (The Engine)

- [ ] 2.1 Implement `CycleEngine.calculateClosingDate` with clamping logic for month-end (Day 31 problem).
- [ ] 2.2 Implement `CycleEngine.calculateDueDate` to determine the first payment date from closing date.
- [ ] 2.3 Implement `CycleEngine.generateDates` to create a sequence of due dates for N installments.
- [ ] 2.4 Implement date normalization to midnight local time across all `CycleEngine` methods to avoid timezone shifts.

## Phase 3: Integration & Wiring

- [ ] 3.1 Refactor `DebtService.addPurchase` to use `CycleEngine.calculateClosingDate` and `calculateDueDate` for the first installment.
- [ ] 3.2 Refactor `DebtService.addPurchase` to use `CycleEngine.generateDates` for subsequent installments.
- [ ] 3.3 Ensure `DebtService.addPurchase` correctly maps these dates to the `Installment` objects before persistence.

## Phase 4: Testing & Verification (TDD)

- [ ] 4.1 Write Vitest unit tests for `CycleEngine.calculateClosingDate` covering scenarios: before closing, after closing, and Day 31 clamp.
- [ ] 4.2 Write Vitest unit tests for `CycleEngine.calculateDueDate` covering standard and February/Leap Year edge cases.
- [ ] 4.3 Write Vitest unit tests for `CycleEngine.generateDates` verifying date consistency across multiple months.
- [ ] 4.4 Perform integration test in `DebtService.addPurchase` to verify that persisted `Installment` objects have the correct due dates.

## Phase 5: Cleanup & Polish

- [ ] 5.1 Remove obsolete `setMonth` logic from `DebtService`.
- [ ] 5.2 Add JSDoc documentation to `CycleEngine` methods explaining the financial logic.
