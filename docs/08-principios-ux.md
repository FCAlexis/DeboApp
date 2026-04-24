# Principios de UX y Producto - DeboApp

## 🌟 Filosofía Central
**La simplicidad ES el buen UX.** 
El objetivo es que el usuario (especialmente adultos no tech) pueda operar la aplicación sin fricción, sin manuales y sin estrés.

## ⏱️ La Regla de los 5 Segundos
Si un usuario abre la app y en **5 segundos** no puede responder estas tres preguntas, la interfaz ha fallado:
1. ¿Cuánto debo en total?
2. ¿A quién le debo?
3. ¿Tengo que pagar algo hoy?

---

## 🎯 Pilares de Implementación

### 1. MVP Ultra Simple
Evitar el "ruido" visual. La pantalla principal debe priorizar:
- Monto total adeudado.
- Desglose rápido por persona.
- Alerta de próximo vencimiento.

### 2. Acciones Obvias (Cero Fricción)
Uso de CTAs (Call to Action) claros y prominentes:
- ➕ "Agregar compra"
- 💰 "Registrar pago"
Sin menús anidados ni flujos complejos.

### 3. Lenguaje Humano (No Técnico)
Prohibido el uso de terminología contable o técnica.
- ✅ **Usar:** Compra, Pago, Impuesto, "A quién le debés".
- ❌ **Evitar:** Transacción, Entidad, Ajuste contable, Ledger.

### 4. Automatización Silenciosa
El usuario no debe gestionar la deuda, el sistema lo hace por él.
- El usuario ingresa el monto del pago $\rightarrow$ El algoritmo distribuye el pago automáticamente según las reglas de negocio.
- El usuario no elige qué cuota pagar; el sistema elige la correcta.

### 5. Feedback de Confianza
Cada acción debe cerrar con una confirmación clara y humana:
> "Pagaste $20.000 a Juan. Se cubrieron 2 cuotas."

---

## ⚠️ Anti-Patrones (Lo que NO debemos hacer)
- ❌ Dashboards complejos con múltiples gráficos.
- ❌ Exceso de filtros de búsqueda.
- ❌ Múltiples categorías de deuda innecesarias.
- ❌ Configuraciones avanzadas que el usuario promedio no entiende.

## 💡 Insight Final
El usuario no busca "gestionar finanzas", busca **"no sentirse perdido con la plata"**.
