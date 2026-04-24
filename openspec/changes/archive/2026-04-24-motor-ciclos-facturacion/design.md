# Design: Implementación de Motor de Ciclos de Facturación

## Technical Approach

Implementar un motor de cálculo puro (`CycleEngine`) encargado de la aritmética de fechas financieras. Este motor será consumido por el `DebtService` al momento de registrar una compra para generar el cronograma de cuotas. El sistema transicionará de un cálculo basado en meses calendario a uno basado en la configuración de ciclo de la tarjeta (Cierre $\rightarrow$ Vencimiento).

## Architecture Decisions

### Decision: Stateless Utility for CycleEngine

**Choice**: Clase con métodos estáticos (`CycleEngine`).
**Alternatives considered**: Inyectable de Angular (`@Injectable`).
**Rationale**: La lógica de cálculo de fechas es una función pura: para una misma fecha de compra y configuración, el resultado siempre es el mismo. Evitar la sobrecarga de DI simplifica los tests unitarios y el uso en otros servicios.

### Decision: Person-Level Card Configuration

**Choice**: Agregar `closingDay` y `dueDay` directamente al modelo `Person`.
**Alternatives considered**: Crear una entidad `Card` separada.
**Rationale**: Siguiendo la filosofía de simplicidad actual, el usuario solo maneja una configuración por persona. Si el requerimiento evoluciona a múltiples tarjetas, la migración a una entidad `Card` será trivial ya que el `CycleEngine` ya estará desacoplado.

## Data Flow

```
DebtService.addPurchase 
    │
    ▼
CycleEngine.calculateClosingDate(purchaseDate, closingDay) ──→ ClosingDate
    │
    ▼
CycleEngine.calculateDueDate(closingDate, dueDay) ───────────→ FirstDueDate
    │
    ▼
CycleEngine.generateDates(firstDueDate, count, dueDay) ──────→ Date[] (Installments)
    │
    ▼
DebtService $\rightarrow$ Persistence (IndexedDB)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `ui/src/app/core/cycle-engine.ts` | Create | Motor de cálculo de fechas con lógica de clamping para fin de mes. |
| `ui/src/app/core/debt-state.service.ts` | Modify | Agregar `closingDay: number` y `dueDay: number` a la interfaz `Person`. |
| `ui/src/app/core/debt.service.ts` | Modify | Integrar `CycleEngine` en `addPurchase` para sustituir `setMonth`. |

## Interfaces / Contracts

### Person Model Update
```typescript
export interface Person {
  id: string;
  name: string;
  closingDay: number; // Día del mes de cierre (1-31)
  dueDay: number;     // Día del mes de vencimiento (1-31)
}
```

### CycleEngine API
```typescript
export class CycleEngine {
  static calculateClosingDate(purchaseDate: Date, closingDay: number): Date;
  static calculateDueDate(closingDate: Date, dueDay: number): Date;
  static generateDates(firstDueDate: Date, count: number, dueDay: number): Date[];
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `CycleEngine` methods | Vitest: Suite de casos borde (Día 31, Feb, Leap Years) basados en la spec. |
| Integration | `DebtService.addPurchase` | Verificar que las cuotas persistidas coincidan con los cálculos del motor. |

## Migration / Rollout

No migration required for existing data, but new `Person` records MUST be created with `closingDay` and `dueDay` defaults (e.g., 15 and 5).

## Open Questions

- [ ] ¿Deberíamos permitir que el usuario configure la fecha de cierre como "último día del mes" explícitamente o simplemente manejarlo mediante el valor 31? (Se asume 31 por simplicidad).
