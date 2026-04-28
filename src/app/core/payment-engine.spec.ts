import { PaymentEngine, DebtItem, PaymentResult } from './payment-engine';

describe('PaymentEngine', () => {
  const personaId = 'test-persona';

  it('should fully pay a single installment', () => {
    const deudas: DebtItem[] = [{
      id: 'd1',
      tipo: 'CUOTA',
      personaId,
      fechaVencimiento: new Date(),
      createdAt: new Date(),
      montoTotalCentavos: 5000,
      montoPagadoCentavos: 0
    }];
    
    const result = PaymentEngine.distribuirPago(personaId, 5000, deudas);
    
    expect(result.totalAppliedCents).toBe(5000);
    expect(result.remainingCents).toBe(0);
    expect(result.allocations).toEqual([{ debtItemId: 'd1', amountCents: 5000 }]);
  });

  it('should handle partial payments', () => {
    const deudas: DebtItem[] = [{
      id: 'd1',
      tipo: 'CUOTA',
      personaId,
      fechaVencimiento: new Date(),
      createdAt: new Date(),
      montoTotalCentavos: 5000,
      montoPagadoCentavos: 0
    }];
    
    const result = PaymentEngine.distribuirPago(personaId, 2000, deudas);
    
    expect(result.totalAppliedCents).toBe(2000);
    expect(result.remainingCents).toBe(0);
    expect(result.allocations).toEqual([{ debtItemId: 'd1', amountCents: 2000 }]);
  });

  it('should distribute payment in cascade (multiple installments)', () => {
    const deudas: DebtItem[] = [
      { id: 'd1', tipo: 'CUOTA', personaId, fechaVencimiento: new Date('2026-01-01'), createdAt: new Date(), montoTotalCentavos: 5000, montoPagadoCentavos: 0 },
      { id: 'd2', tipo: 'CUOTA', personaId, fechaVencimiento: new Date('2026-02-01'), createdAt: new Date(), montoTotalCentavos: 5000, montoPagadoCentavos: 0 }
    ];
    
    const result = PaymentEngine.distribuirPago(personaId, 12000, deudas);
    
    expect(result.totalAppliedCents).toBe(10000);
    expect(result.remainingCents).toBe(2000);
    expect(result.allocations).toEqual([
      { debtItemId: 'd1', amountCents: 5000 },
      { debtItemId: 'd2', amountCents: 5000 }
    ]);
  });

  it('should prioritize overdue installments over current ones', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const deudas: DebtItem[] = [
      { id: 'current', tipo: 'CUOTA', personaId, fechaVencimiento: tomorrow, createdAt: new Date(), montoTotalCentavos: 5000, montoPagadoCentavos: 0 },
      { id: 'overdue', tipo: 'CUOTA', personaId, fechaVencimiento: yesterday, createdAt: new Date(), montoTotalCentavos: 5000, montoPagadoCentavos: 0 }
    ];
    
    // Pago solo para una cuota
    const result = PaymentEngine.distribuirPago(personaId, 5000, deudas);
    
    expect(result.allocations[0].debtItemId).toBe('overdue');
    expect(result.totalAppliedCents).toBe(5000);
  });

  it('should throw error if payment amount is zero or negative', () => {
    const deudas: DebtItem[] = [];
    expect(() => PaymentEngine.distribuirPago(personaId, 0, deudas)).toThrow("El monto del pago debe ser mayor a cero");
    expect(() => PaymentEngine.distribuirPago(personaId, -100, deudas)).toThrow("El monto del pago debe ser mayor a cero");
  });
});
