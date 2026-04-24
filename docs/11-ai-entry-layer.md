# Estrategia de Entrada Inteligente (AI Entry Layer)

## 🎯 Objetivo
Reducir la fricción de carga de datos permitiendo que el usuario registre compras, pagos y personas mediante lenguaje natural (texto o voz), transformando esa intención en datos estructurados y validados.

## ⚙️ El Pipeline de Datos (Flujo de Confianza)
Para garantizar la integridad financiera, la IA nunca escribirá directamente en la base de datos. El flujo obligatorio es:

`Entrada Natural` $\rightarrow$ `LLM (Traductor)` $\rightarrow$ `JSON Estructurado` $\rightarrow$ `Revisión Humana` $\rightarrow$ `Core Logic` $\rightarrow$ `Persistencia`

### 1. Capa de Traducción (LLM)
El sistema enviará el texto del usuario a un modelo de lenguaje con un prompt estrictamente tipado para devolver un JSON.
- **Entrada:** "Le compré una notebook en 6 cuotas sin interés con la tarjeta de Juan, 300 mil"
- **Salida esperada:**
  ```json
  {
    "intent": "CREATE_PURCHASE",
    "params": {
      "description": "Notebook",
      "total_cents": 30000000,
      "installments": 6,
      "person_name": "Juan",
      "interest_free": true
    }
  }
  ```

### 2. Filtro de Confianza (Confirmación Humana)
La aplicación presentará una "Tarjeta de Confirmación" donde el usuario puede:
- ✅ **Confirmar:** El JSON se envía al `PaymentEngine` y se guarda.
- ✏️ **Editar:** El usuario corrige el monto o la persona manualmente.
- ❌ **Cancelar:** Se descarta la operación.

## 🛠️ Implementación Técnica

### Integración con el Core
La IA es simplemente un "método de entrada" más. No altera la lógica de negocio. El `PaymentEngine` seguirá recibiendo los mismos objetos que si hubieran sido cargados por un formulario manual.

### Estrategias de Entrada
- **Fase 1 (Texto):** Input de texto simple $\rightarrow$ API $\rightarrow$ JSON.
- **Fase 2 (Voz):** Speech-to-Text $\rightarrow$ Texto $\rightarrow$ API $\rightarrow$ JSON.
- **Fase 3 (Vision):** OCR de tickets/resúmenes $\rightarrow$ Texto $\rightarrow$ API $\rightarrow$ JSON.

## ⚠️ Restricciones Críticas
- **No Automatización Total:** Prohibido el guardado automático sin revisión humana.
- **Validación de Esquema:** El JSON devuelto por la IA debe ser validado contra un esquema (Zod o similar) antes de mostrarse al usuario.
- **Manejo de Ambigüedad:** Si la IA no puede determinar el monto o la persona, debe responder con una pregunta aclaratoria en lugar de adivinar.
