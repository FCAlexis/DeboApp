# 📱 DeboApp

DeboApp es una herramienta de gestión de cobranzas diseñada para el control de créditos informales. El objetivo principal es automatizar el seguimiento de cuotas y la gestión de pagos sin depender de una conexión a internet.

## 🎯 Motivación
La mayoría de las herramientas de gestión financiera son demasiado complejas o requieren suscripciones. Para quien vende productos en cuotas, el problema real no es anotar la deuda, sino saber **exactamente quién debe pagar hoy** y cómo distribuir un pago parcial entre varias cuotas vencidas. 

DeboApp resuelve esto mediante un motor de ciclos de facturación y un sistema de distribución de pagos en cascada.

## 🛠️ Decisiones Técnicas

Para este proyecto, prioricé la privacidad y la velocidad de respuesta, basando la arquitectura en los siguientes pilares:

### 1. Local-First & Privacidad
Los datos financieros son sensibles. Por ello, la aplicación no utiliza bases de datos externas ni nubes. Toda la información se almacena en el dispositivo del usuario mediante **IndexedDB**, garantizando que los datos nunca salgan del entorno local.

### 2. Estado Reactivo con Angular Signals
En lugar de depender de la detección de cambios tradicional de Angular (Zone.js), implementé la lógica de estado mediante **Signals**. Esto permite que la UI se actualice de forma granular y eficiente, eliminando renderizados innecesarios en el Dashboard.

### 3. Precisión Financiera (Cents over Floats)
Para evitar los errores clásicos de precisión de la coma flotante en JavaScript (donde `0.1 + 0.2` no es exactamente `0.3`), toda la lógica monetaria se maneja en **centavos (enteros)**. Las conversiones a decimales solo se realizan en la capa de presentación.

### 4. Algoritmo de Distribución "Waterfall"
El sistema de pagos no asigna el dinero al azar. Implementé un motor de cascada que distribuye los abonos siguiendo este orden:
1. Identifica la cuota más antigua y vencida.
2. Aplica el pago hasta cubrir el total de esa cuota.
3. Si sobra dinero, pasa a la siguiente cuota en orden cronológico.

## 💻 Compatibilidad y Despliegue

DeboApp está construida con **Tauri**, lo que permite distribuir la aplicación como un binario nativo para múltiples sistemas operativos sin sacrificar el rendimiento.

- **Soporte Multiplataforma**: Diseñada para funcionar en **Windows 10/11**, **Linux** (probada en Arch Linux / KDE Plasma) y **Android**.
- **Optimización en Linux**: Para asegurar la estabilidad en sesiones de **Wayland**, se recomienda ejecutar la aplicación con la variable `GDK_BACKEND=x11` para evitar problemas de renderizado del buffer GBM.
- **Distribución**: El proyecto genera instaladores nativos (`.exe` para Windows, `.deb` o `.AppImage` para Linux y `.apk` para Android), eliminando la necesidad de que el usuario instale un navegador o dependencias externas.

## 🚀 Instalación y Ejecución

### Requisitos
- Node.js (LTS)
- Angular CLI

### Pasos
1. Clonar el repositorio:
   ```bash
   git clone https://github.com/FCAlexis/DeboApp.git
   ```
2. Instalar dependencias:
   ```bash
   pnpm install
   ```
3. Ejecutar en modo desarrollo:
   ```bash
   pnpm start
   ```

## 🗺️ Roadmap
- [x] Motor de distribución de pagos en cascada.
- [x] Gestión de ciclos de vencimiento automáticos.
- [x] Dashboard de salud financiera y recuperación.
- [x] Vista de calendario de cobranza.
- [ ] Implementar exportación de estados de cuenta en PDF.
- [ ] Añadir sistema de backup automatizado en archivos JSON.
