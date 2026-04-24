# Estrategia de Sincronización y Persistencia - DeboApp

## 🎯 Filosofía: Local-First
La aplicación debe ser totalmente funcional sin conexión a internet. La persistencia local es la fuente de verdad primaria, y la sincronización es un proceso secundario de respaldo y disponibilidad multi-dispositivo.

## 🛠️ Niveles de Evolución de Datos

### Nivel 1: MVP (Manual JSON Bridge)
- **Almacenamiento:** IndexedDB (vía Capacitor/Web) para persistencia local.
- **Sincronización:** Exportación e Importación de archivos JSON.
- **Flujo:** El usuario genera un archivo `.json` en un dispositivo y lo carga en otro.
- **Riesgo:** Sobreescritura de datos si no se maneja el merge.

### Nivel 2: Cloud Mirror (Sincronización Automática)
- **Almacenamiento:** Local DB $\leftrightarrow$ Cloud DB (Supabase/Firebase).
- **Sincronización:** Sincronización en segundo plano basada en marcas de tiempo (`updated_at`).
- **Flujo:** Cada cambio local se marca como "sucio" (`dirty: true`) y se envía a la nube cuando hay conexión.

### Nivel 3: Distributed Ledger (Consistencia Total)
- **Sincronización:** Resolución de conflictos inteligente o CRDTs.
- **Flujo:** Manejo de versiones de registros para evitar pérdida de datos en ediciones simultáneas.

---

## 📜 Contrato de Identidad y Datos

Para permitir la migración entre niveles sin pérdida de datos, se establecen las siguientes reglas:

1. **Identificadores Universales:** Queda estrictamente prohibido el uso de IDs autoincrementales. Todos los registros deben usar **UUID v4**.
2. **Marcas de Tiempo:** Cada registro debe incluir `created_at` y `updated_at` en formato ISO 8601 (UTC).
3. **Formato de Intercambio:** El formato estándar de transporte es JSON, siguiendo la estructura:
   ```json
   {
     "version": "1.0",
     "exported_at": "timestamp",
     "data": {
       "personas": [],
       "compras": [],
       "cuotas": [],
       "pagos": [],
       "ajustes": []
     }
   }
   ```

## ⚠️ Manejo de Conflictos (MVP)
Para el Nivel 1 y 2, se aplicará la estrategia **LWW (Last Write Wins)**: el registro con la fecha de `updated_at` más reciente prevalece sobre las versiones anteriores.
