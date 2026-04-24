# 📱 DeboApp

**DeboApp** es una aplicación de gestión financiera personal enfocada en el control de deudas y créditos, diseñada específicamente para usuarios que necesitan simplicidad y precisión en el seguimiento de sus cuentas por cobrar y pagar.

## 🎯 Visión del Producto
La aplicación nace para resolver el problema de la gestión de créditos informales y tarjetas de crédito, donde el cálculo de fechas de corte y vencimiento suele ser confuso. **DeboApp** automatiza este proceso mediante un motor de ciclos de facturación, permitiendo que el usuario sepa exactamente cuánto debe y cuándo debe pagar, sin complicaciones.

## 🚀 Stack Tecnológico
La aplicación ha sido construida siguiendo los estándares más modernos de desarrollo frontend para garantizar rendimiento y mantenibilidad:

- **Framework:** [Angular 21](https://angular.dev)
- **Reactividad:** Signals (NgSignals) para un manejo de estado eficiente y granular.
- **Arquitectura:** Clean Architecture & Local-First.
- **Persistencia:** IndexedDB (almacenamiento local en el dispositivo).
- **Estilo:** Mobile-First (Diseñado principalmente para uso en dispositivos móviles/APK).
- **Precisión Financiera:** Implementación de "Cents over Floats" (todos los cálculos se realizan en centavos utilizando enteros para evitar errores de precisión de coma flotante).

## ⚙️ Arquitectura y Conceptos Clave

### 1. Local-First
La aplicación prioriza la disponibilidad offline y la velocidad de respuesta. Los datos se almacenan localmente en el dispositivo del usuario, eliminando la latencia de red y asegurando la privacidad de los datos financieros.

### 2. Motor de Ciclos de Facturación (`CycleEngine`)
A diferencia de las aplicaciones de notas simples, DeboApp implementa un motor lógico que calcula:
- **Fechas de Cierre:** Basado en la configuración de la tarjeta.
- **Fechas de Vencimiento:** Cálculo automático de la primera cuota y cuotas subsecuentes.
- **Clamping de Días:** Manejo inteligente de meses con 28, 30 o 31 días.

### 3. Flujo de Desarrollo (SDD)
Este proyecto sigue el flujo de **Spec-Driven Development (SDD)**:
`Propuesta` $\rightarrow$ `Especificación (Spec)` $\rightarrow$ `Diseño Técnico` $\rightarrow$ `Implementación` $\rightarrow$ `Verificación`.

## 🛠️ Instalación y Ejecución

### Requisitos
- Node.js (Versión LTS recomendada)
- Angular CLI

### Pasos para ejecutar en local
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/FCAlexis/DeboApp.git
   ```
2. Instalar dependencias:
   ```bash
   cd ui
   npm install
   ```
3. Ejecutar el servidor de desarrollo:
   ```bash
   npm start
   ```

## 📜 Guía de Contribución
Para mantener la calidad del proyecto, todas las contribuciones deben seguir el flujo:
1. Crear una rama de característica (`feat/nombre-mejora`).
2. Actualizar la especificación en `.sdd/` si la funcionalidad cambia.
3. Implementar los cambios y añadir pruebas unitarias.
4. Abrir un Pull Request para revisión.
