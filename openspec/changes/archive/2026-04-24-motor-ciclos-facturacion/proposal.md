# Proposal: Implementación de Motor de Ciclos de Facturación

## Intent

Reemplazar la lógica actual de generación de cuotas (que usa meses calendario simples) por un motor de ciclos de facturación real. El objetivo es que las fechas de vencimiento de las cuotas reflejen el ciclo de cierre y vencimiento de la tarjeta de crédito del usuario, eliminando errores de cálculo y mejorando la precisión financiera.

## Scope

### In Scope
- Implementación de `CycleEngine` para calcular fechas de cierre y vencimiento.
- Actualización del modelo de `Person` o creación de `CardConfig` para almacenar `closingDay` y `dueDay`.
- Refactorización de `DebtService.addPurchase` para usar el `CycleEngine`.
- Implementación de lógica para manejar el "problema del día 31" (ajuste al último día del mes).

### Out of Scope
- Soporte para múltiples tarjetas por persona (se inicia con una configuración global por persona).
- Integración con APIs bancarias reales.

## Capabilities

### New Capabilities
- `billing-cycle-calculation`: Capacidad de determinar la fecha de cierre y el primer vencimiento de una compra basándose en la configuración de la tarjeta.

### Modified Capabilities
- `purchase-registration`: La creación de cuotas ahora depende del motor de ciclos en lugar de una suma simple de meses.

## Approach

Implementar un servicio puro (`CycleEngine`) que reciba la fecha de compra y la configuración de la tarjeta (`closingDay`, `dueDay`). 
1. **Cálculo de Cierre**: Determinar si la compra ocurrió antes o después del día de cierre del mes actual.
2. **Cálculo de Vencimiento**: Sumar el offset correspondiente desde el cierre hasta el vencimiento.
3. **Generación de Cuotas**: Iterar el número de cuotas sumando meses exactos a la primera fecha de vencimiento calculada, normalizando siempre al día del vencimiento configurado.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `ui/src/app/core/debt.service.ts` | Modified | `addPurchase` usará el `CycleEngine`. |
| `ui/src/app/core/debt-state.service.ts` | Modified | Actualización de modelos para incluir días de cierre/vencimiento. |
| `ui/src/app/core/cycle-engine.ts` | New | Nueva clase con la lógica de cálculo de fechas. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Errores en meses cortos (Feb) | Med | Usar lógica de "clamping" al último día del mes. |
| Desplazamiento por zona horaria | Low | Normalizar todas las fechas a medianoche local. |

## Rollback Plan

1. Revertir cambios en `DebtService` para volver a la lógica de `setMonth`.
2. Eliminar la clase `CycleEngine`.
3. Limpiar campos `closingDay` y `dueDay` de la base de datos si es necesario.

## Dependencies

- `uuid` (ya presente) para identificadores únicos.

## Success Criteria

- [ ] Una compra el día 10 con cierre el 15 vence el día 5 del mes siguiente.
- [ ] Una compra el día 16 con cierre el 15 vence el día 5 del mes subsiguiente.
- [ ] El sistema no crashea ni salta meses al manejar el día 31 en meses de 30 días.
- [ ] Todas las cuotas generadas mantienen el mismo día de vencimiento.
