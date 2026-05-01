# Modelo de Datos

## Usuario
- id
- nombre

## Persona
- id
- nombre

## Compra
- id
- descripcion
- monto_total
- cuotas
- interes
- fecha
- persona_id

## Cuota
- id
- numero
- monto
- fecha_vencimiento
- estado
- compra_id

## Pago
- id
- monto
- fecha
- persona_id

## Ajuste
- id
- tipo (impuesto, recargo)
- monto
- fecha
- persona_id
- compra_id (opcional)
- estado
