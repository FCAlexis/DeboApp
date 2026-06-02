# Design: UX and Responsive Strategy

## Intent
Garantizar que DeboApp proporcione una experiencia de usuario óptima independientemente del dispositivo, transitando de un enfoque estrictamente Mobile-First a un diseño Adaptativo (Responsive).

## Strategy: Adaptive Layouts
La aplicación utilizará un sistema de contenedores fluidos y breakpoints definidos para adaptar la disposición de los elementos según la resolución de pantalla.

### 1. Breakpoints Definidos
- **Mobile (< 600px):** Enfoque en una sola columna. Elementos táctiles grandes (min 44px). Navegación simplificada.
- **Tablet (600px - 1024px):** Uso de grillas de dos columnas. Expansión de tarjetas de balance.
- **Desktop (> 1024px):** Layout de panel (Dashboard). Uso de espacio lateral para formularios y listas simultáneamente. Centrado de contenido con ancho máximo para evitar fatiga visual.

### 2. UI Patterns por Dispositivo

| Elemento | Mobile | Desktop |
| :--- | :--- | :--- |
| **Contenedor Principal** | 100% width, padding lateral | Max-width: 1200px, centrado |
| **Formularios** | Vertical stack, inputs full-width | Horizontal/Grid, etiquetas alineadas |
| **Listados** | Lista vertical de tarjetas | Grilla de tarjetas o tabla detallada |
| **Acciones (FAB)** | Botón flotante inferior derecho | Botones de acción integrados en header/sidebar |
| **Navegación** | Menú inferior o Bottom Sheet | Barra lateral (Sidebar) o Header extendido |

## Technical Implementation
- **CSS Custom Properties:** Uso de variables para márgenes y paddings que cambian según el breakpoint.
- **Flexbox & Grid:** Implementación de `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))` para layouts auto-adaptables.
- **Relative Units:** Uso de `rem` y `em` en lugar de `px` para tipografía y espaciados.

## Success Criteria
- El Dashboard debe ser legible y usable en un iPhone SE (320px) y en un monitor 4K.
- No debe aparecer scroll horizontal en ningún dispositivo.
- Los elementos interactivos deben mantener un área de toque mínima de 44x44px en modo móvil.
