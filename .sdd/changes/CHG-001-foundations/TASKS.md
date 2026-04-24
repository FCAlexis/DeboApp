# TASKS: Cimientos y Flujo Básico de Datos (CHG-001)

## 🛠️ Fase 1: Infraestructura y Persistencia Local
- [ ] **T1.1: Setup de Entorno Angular 21**
  - Crear la estructura de carpetas `src/app/core`, `src/app/features`, `src/app/shared`.
  - Configurar el proyecto como Standalone.
- [ ] **T1.2: Implementación de `LocalDbService`**
  - Definir los Object Stores: `persons`, `cards`, `purchases`, `installments`, `payments`.
  - Implementar métodos genéricos: `getAll<T>`, `put`, `delete`.
- [ ] **T1.3: Verificación de Persistencia**
  - Validar que se pueden guardar y leer datos de IndexedDB.

## 🧠 Fase 2: Capa de Estado y Lógica de Dominio
- [ ] **T2.1: Implementación de `DebtStateService` (The Signal Store)**
  - Crear señales escribibles para las 5 entidades (incluyendo `cards`).
  - Implementar `totalDebt` y `debtByPerson` como computed signals.
- [ ] **T2.2: Implementación de `DebtService` (The Coordinator)**
  - Implementar `addPerson(name, cards)`: Guardar persona y sus tarjetas.
  - Implementar `calculateDueDate(date, card, n)`: Lógica de cierre y vencimiento de tarjeta.
  - Implementar `addPurchase(cardId, ...)`: 
    - Recuperar tarjeta $\rightarrow$ Calcular fechas reales $\rightarrow$ Generar cuotas $\rightarrow$ Guardar todo.
- [ ] **T2.3: Integración del `PaymentEngine`**
  - Usar el motor para distribuir pagos sobre las cuotas con fechas reales.

## 🎨 Fase 3: Interfaz de Usuario (UI)
- [ ] **T3.1: `DashboardComponent`**
  - Implementar visualización del `totalDebt()` y la lista de personas con su saldo.
- [ ] **T3.2: `PersonFormComponent`**
  - Implementar formulario de creación de persona y sus tarjetas asociadas.
- [ ] **T3.3: `PurchaseFormComponent`**
  - Implementar formulario con select de tarjetas, monto y cuotas.
- [ ] **T3.4: Ensamblado en `AppComponent`**

## 🧪 Fase 4: Verificación Final y QA
- [ ] **T4.1: Test de Flujo Completo (End-to-End)**
- [ ] **T4.2: Test de Persistencia**
- [ ] **T4.3: Validación de Fechas de Tarjeta**
  - Verificar que una compra el día 21 (con cierre el 20) vence el mes siguiente.
