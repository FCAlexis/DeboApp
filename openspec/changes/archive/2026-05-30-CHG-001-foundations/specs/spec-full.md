# SPECIFICATION: Cimientos y Flujo Básico de Datos (CHG-001)

## 🎯 Objetivo
Implementar la funcionalidad mínima viable para la gestión de deudas local, garantizando la persistencia de datos y la reactividad de la interfaz.

## 📋 Requerimientos Funcionales

### RF01 - Gestión de Personas y Tarjetas
- **Carga de Persona:** El usuario puede crear una persona con un nombre obligatorio.
- **Carga de Tarjeta:** El usuario puede asociar una o más tarjetas a una persona:
  - Nombre de la tarjeta (ej. "Visa Oro").
  - Día de cierre (1-31).
  - Día de vencimiento (1-31).
- **Persistencia:** Ambos deben usar UUID v4.

### RF02 - Gestión de Compras y Generación de Cuotas Reales
- **Carga:** El usuario registra una compra indicando:
  - Descripción, Monto Total, Cantidad de Cuotas.
  - **Tarjeta Asociada** (esto define la persona).
- **Cálculo de Vencimiento (Ciclo de Tarjeta):**
  - Si `dia_compra <= dia_cierre`, la primera cuota vence el `dia_vencimiento` del mes actual (o siguiente si ya pasó).
  - Si `dia_compra > dia_cierre`, la primera cuota vence el `dia_vencimiento` del mes siguiente.
- **Procesamiento:** El sistema genera N cuotas con sus fechas de vencimiento reales basadas en el ciclo de la tarjeta.
- **Persistencia:** Guardar la compra y todas sus cuotas asociadas en una sola transacción local.

### RF03 - Dashboard de Deuda
- **Cálculo de Saldo:** El sistema debe calcular la deuda total sumando todas las cuotas y ajustes pendientes, restando los pagos realizados.
- **Sincronización de UI:** El uso de Angular Signals debe garantizar que cualquier cambio en una compra o pago se refleje instantáneamente en el Dashboard sin recargar la página.
- **Visualización:** 
  - Monto Total Global.
  - Lista de personas con su saldo pendiente individual.

---

## 🛠️ Requerimientos Técnicos y Reglas de Integridad

### 1. Gestión de Montos (Precisión Financiera)
- **Cero Floats:** Todas las operaciones matemáticas y el almacenamiento en DB local deben usar enteros (`number` en TS tratado como centavos).
- ** Conversión:** La UI debe encargarse de la conversión `centavos <-> formato moneda` solo en la capa de presentación.

### 2. Identidad y Referencias
- **UUIDv4:** Todos los registros deben usar UUIDs para evitar colisiones en futuras sincronizaciones.
- **Integridad Referencial:** Una cuota no puede existir sin una compra asociada. Una compra no puede existir sin una persona asociada.

### 3. Persistencia Local
- **Almacenamiento:** Utilizar IndexedDB para persistir datos.
- **Operaciones Atómicas:** La creación de una compra y sus cuotas debe ser una operación atómica (si falla la creación de una cuota, se revierte la compra).

---

## 🧪 Casos de Prueba para Verificación (Acceptance Criteria)

### Caso 1: Generación de Cuotas Exactas
- **Input:** Compra de $100.000 en 3 cuotas.
- **Resultado esperado:** 
  - Cuota 1: $33.334
  - Cuota 2: $33.333
  - Cuota 3: $33.333
  - Total almacenado: $100.000

### Caso 2: Persistencia tras Reinicio
- **Input:** Crear persona "Juan" y compra de $50.000.
- **Acción:** Recargar la página del navegador.
- **Resultado esperado:** "Juan" y la deuda de $50.000 siguen visibles en el Dashboard.

### Caso 3: Reactividad Instantánea
- **Input:** Agregar una nueva compra mientras el Dashboard está abierto.
- **Resultado esperado:** El monto total en el Dashboard se actualiza en tiempo real mediante la señal (`computed signal`).

### Caso 4: Validación de Datos
- **Input:** Intentar crear una compra con monto $0 o cuotas $0.
- **Resultado esperado:** El sistema debe rechazar la entrada y mostrar un mensaje de error.
