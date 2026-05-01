# Motor de Distribución de Pagos - Especificación Técnica

## 🎯 Objetivo
Garantizar que cada centavo ingresado por el usuario sea asignado de manera determinística, exacta y auditable a las deudas pendientes, eliminando cualquier ambigüedad en el saldo final.

## 🛠️ Principios Fundamentales

### 1. Precisión Matemática
- **No Floats:** Todo monto se maneja en **centavos (integers)**. 
  - Ejemplo: `$10.000` $\rightarrow$ `1000000` centavos.
- **Determinismo:** Mismo input $\rightarrow$ mismo output. El orden de aplicación es estable.
- **Inmutabilidad:** Los montos originales de compras y ajustes no se modifican. Solo se acumulan pagos.

### 2. Lógica de Priorización (El Orden Sagrado)
Para distribuir un pago, las deudas se ordenan siguiendo estrictamente este criterio:
1. **Estado de Vencimiento:** Vencidos primero $\rightarrow$ No vencidos después.
2. **Antigüedad:** Fecha de vencimiento más antigua primero.
3. **Tipo de Deuda:** Ajustes primero $\rightarrow$ Cuotas después.
4. **Fecha de Creación:** El registro más antiguo primero.
5. **ID:** Desempate final por ID para garantizar estabilidad total.

---

## ⚙️ Algoritmo de Distribución

### Flujo de Ejecución
1. **Carga:** Obtener todas las deudas de la `persona_id` con `monto_total > monto_pagado`.
2. **Ordenamiento:** Aplicar la función de prioridad definida.
3. **Asignación Greedy:**
   - Recorrer la lista de deudas ordenadas.
   - Calcular el saldo pendiente de la deuda actual: `saldo = total - pagado`.
   - Asignar el monto menor entre el `restante_del_pago` y el `saldo`.
   - Restar el monto asignado al `restante_del_pago`.
   - Registrar la asignación (`PaymentAllocation`).
   - Repetir hasta que el pago se agote o no queden deudas.

### Manejo de Cuotas (Distribución de Restos)
Para evitar pérdida de centavos en divisiones no exactas (ej. $100 / 3$):
- El resto de la división entera se asigna siempre a la **primera cuota**.
- Ejemplo: $100.000 / 3 \rightarrow$ Cuota 1: `33.334`, Cuota 2: `33.333`, Cuota 3: `33.333`.

---

## ⚠️ Casos Borde y Manejo de Errores

- **Sobrepago:** Si `restante > 0` al finalizar el ciclo, el monto se marca como "Saldo a Favor" o se retorna un aviso al usuario.
- **Sin Deudas:** Si no hay deudas pendientes, el pago se retorna íntegramente como restante.
- **Deudas sin Fecha:** Se consideran no vencidas y se posicionan al final de la cola de prioridad.

## 🛡️ Consideraciones de Implementación (Backend)
- **Concurrencia:** Se debe utilizar bloqueo pesimista (`SELECT FOR UPDATE`) sobre las deudas de la persona durante la transacción de pago para evitar doble asignación.
- **Trazabilidad:** Cada asignación debe persistirse en una tabla de `PaymentAllocations` para permitir auditorías históricas.
