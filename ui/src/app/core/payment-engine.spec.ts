import { describe, it, expect } from 'vitest';
import { PaymentEngine } from './payment-engine';

describe('PaymentEngine - Distribución de Pagos', () => {
  
  it('debe distribuir un pago exacto que cubre una sola cuota', () => {
    const debtItems = [
      { id: '1', tipo: 'CUOTA', personaId: 'p1', fechaVencimiento: new Date(), createdAt: new Date(), montoTotalCentavos: 1000, montoPagadoCentavos: 0 },
      { id: '2', tipo: 'CUOTA', personaId: 'p1', fechaVencimiento: new Date(), createdAt: new Date(), montoTotalCentavos: 1000, montoPagadoCentavos: 0 }
    ];

    const result = PaymentEngine.distribuirPago('p1', 1000, debtItems);
    
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].debtItemId).toBe('1');
    expect(result.allocations[0].amountCents).toBe(1000);
    expect(result.remainingCents).toBe(0);
  });

  it('debe distribuir un pago que cubre múltiples cuotas parcialmente', () => {
    const debtItems = [
      { id: '1', tipo: 'CUOTA', personaId: 'p1', fechaVencimiento: new Date(), createdAt: new Date(), montoTotalCentavos: 500, montoPagadoCentavos: 0 },
      { id: '2', tipo: 'CUOTA', personaId: 'p1', fechaVencimiento: new Date(), createdAt: new Date(), montoTotalCentavos: 500, montoPagadoCentavos: 0 }
    ];

    // Pago de 700 centavos
    const result = PaymentEngine.distribuirPago('p1', 700, debtItems);
    
    expect(result.allocations).toHaveLength(2);
    expect(result.allocations[0].amountCents).toBe(500); // Cuota 1 completa
    expect(result.allocations[1].amountCents).toBe(200); // Cuota 2 parcial
    expect(result.remainingCents).toBe(0);
  });

  it('debe manejar pagos que exceden la deuda total disponible', () => {
    const debtItems = [
      { id: '1', tipo: 'CUOTA', personaId: 'p1', fechaVencimiento: new Date(), createdAt: new Date(), montoTotalCentavos: 100, montoPagadoCentavos: 0 }
    ];

    // Pago de 500 cuando la deuda es 100
    const result = PaymentEngine.distribuirPago('p1', 500, debtItems);
    
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].amountCents).toBe(100);
    expect(result.remainingCents).toBe(400); // Sobrante
  });

  it('debe respetar el orden de fecha de vencimiento (FIFO)', () => {
    const dateOld = new Date(2024, 0, 1);
    const dateNew = new Date(2024, 1, 1);

    const debtItems = [
      { id: 'new', tipo: 'CUOTA', personaId: 'p1', fechaVencimiento: dateNew, createdAt: new Date(), montoTotalCentavos: 1000, montoPagadoCentavos: 0 },
      { id: 'old', tipo: 'CUOTA', personaId: 'p1', fechaVencimiento: dateOld, createdAt: new Date(), montoTotalCentavos: 1000, montoPagadoCentavos: 0 }
    ];

    const result = PaymentEngine.distribuirPago('p1', 500, debtItems);
    
    // Debe pagar primero la más antigua ('old')
    expect(result.allocations[0].debtItemId).toBe('old');
    expect(result.allocations[0].amountCents).toBe(500);
  });

  it('debe ignorar cuotas que ya están totalmente pagadas', () => {
    const debtItems = [
      { id: '1', tipo: 'CUOTA', personaId: 'p1', fechaVencimiento: new Date(), createdAt: new Date(), montoTotalCentavos: 1000, montoPagadoCentavos: 1000 },
      { id: '2', tipo: 'CUOTA', personaId: 'p1', fechaVencimiento: new Date(), createdAt: new Date(), montoTotalCentavos: 1000, montoPagadoCentavos: 0 }
    ];

    const result = PaymentEngine.distribuirPago('p1', 500, debtItems);
    
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].debtItemId).toBe('2');
    expect(result.allocations[0].amountCents).toBe(500);
  });
});
