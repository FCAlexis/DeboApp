# PROPOSAL: Cimientos y Flujo Básico de Datos (CHG-001)

## 🎯 Intención
Transformar la prueba de concepto técnica (PaymentEngine) en una aplicación funcional "Local-First". El objetivo es establecer la tubería de datos completa: desde la entrada del usuario hasta la persistencia en el dispositivo, permitiendo la gestión básica de deudas sin depender de un servidor.

## 📦 Alcance (Scope)

### 1. Capa de Persistencia Local
- Implementación de un servicio de almacenamiento local utilizando IndexedDB (vía Capacitor/Web).
- Implementación del contrato de identidad basado en **UUID v4**.
- Soporte para las entidades básicas: `Users`, `Persons`, `Purchases`, `Installments`, `Adjustments` y `Payments`.

### 2. Integración del Núcleo de Negocio
- Adaptación del `PaymentEngine` (TS puro) como un servicio de Angular.
- Creación de un `DebtService` que coordine la persistencia local con la lógica del motor de pagos.

### 3. Interfaz de Usuario Básica (UI)
- **Dashboard:** Vista principal que muestre la deuda total y el desglose por persona usando **Angular Signals**.
- **Gestión de Personas:** Formulario simple para crear y listar personas.
- **Gestión de Compras:** Formulario para registrar una compra y generar automáticamente sus cuotas a través del motor.

## 🛠️ Enfoque Técnico
- **Framework:** Angular 21 (Standalone Components).
- **Estado:** Reactividad total basada en **Signals** (`signal`, `computed`).
- **Sincronización:** Implementación del flujo de "Carga $\rightarrow$ Procesamiento $\rightarrow$ Guardado Local".
- **Datos:** Manejo estricto de montos en centavos (`BIGINT` / `number` como enteros).

## ✅ Criterios de Éxito
La propuesta se considerará exitosa si el usuario puede realizar el siguiente flujo sin errores y sin refrescar la página:
1. Crear una persona (ej. "Mamá").
2. Registrar una compra asociada a esa persona (ej. "Súper $10.000 en 2 cuotas").
3. Ver instantáneamente en el Dashboard que la deuda total aumentó a $10.000 y que la persona "Mamá" tiene ese saldo pendiente.
4. Cerrar y abrir la app, y que los datos sigan allí.

## ⚠️ Riesgos Identificados
- **Migración de datos:** Asegurar que el esquema local sea compatible con el futuro esquema de PostgreSQL.
- **Performance:** Garantizar que la lectura de IndexedDB no bloquee la UI (uso de async/await y signals).
