import { Injector, runInInjectionContext, DestroyRef, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DebtService } from '../../core/services/debt.service';
import { DebtStateService } from '../../core/services/debt-state.service';
import { PaymentComponent } from './payment.component';

function createMockState() {
  const persons = signal<any[]>([]);
  const installments = signal<any[]>([]);

  const debtByPerson = computed(() => {
    const map: Record<string, number> = {};
    installments().forEach((i: any) => {
      const paid = i.amountPaidCents || 0;
      map[i.personId] = (map[i.personId] || 0) + (i.amountCents - paid);
    });
    return map;
  });

  return {
    persons, installments, debtByPerson,
    setPersons: (v: any[]) => persons.set(v),
    setInstallments: (v: any[]) => installments.set(v),
  };
}

describe('PaymentComponent', () => {
  const setupComponent = () => {
    const mockRouter = { navigate: vi.fn() };
    const mockRoute = {
      paramMap: of({ get: (key: string) => 'p1' }),
    };
    const mockState = createMockState();

    const injector = Injector.create({
      providers: [
        { provide: DebtService, useValue: { registerPayment: vi.fn() } },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: DebtStateService, useValue: mockState as any },
        DestroyRef,
      ],
    });

    const component = runInInjectionContext(injector, () => new PaymentComponent());
    return { component, mockRouter, mockState };
  };

  it('should create the component', () => {
    const { component } = setupComponent();
    expect(component).toBeTruthy();
  });

  it('should set personId from route params', () => {
    const { component } = setupComponent();
    expect(component.personId()).toBe('p1');
  });

  it('should show loading when person not found', () => {
    const { component } = setupComponent();
    // With no persons set, the computed should show 'Cargando...'
    expect(component.personName()).toBe('Persona no encontrada');
  });

  it('should resolve person name from state', () => {
    const { component, mockState } = setupComponent();
    mockState.setPersons([{ id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 }]);
    expect(component.personName()).toBe('Juan');
  });

  it('should calculate balance from installments', () => {
    const { component, mockState } = setupComponent();
    mockState.setInstallments([
      { id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1, amountCents: 5000, amountPaidCents: 0, dueDate: new Date() },
      { id: 'i2', personId: 'p1', purchaseId: 'pur1', number: 2, amountCents: 5000, amountPaidCents: 2000, dueDate: new Date() },
    ]);
    expect(component.currentBalance()).toBe(8000);
  });

  it('should have paymentAmount default to 0', () => {
    const { component } = setupComponent();
    expect(component.paymentAmount).toBe(0);
  });

  it('should start without receipt showing', () => {
    const { component } = setupComponent();
    expect(component.showReceipt()).toBe(false);
  });

  it('should navigate with just the path when personId is null', () => {
    const { component, mockRouter } = setupComponent();
    // Override with null personId
    (component as any).personId.set(null);
    component.goBack();
    // goBack() uses: id || '/dashboard', so ['/person', '/dashboard']
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/person', '/dashboard']);
  });

  it('should format currency correctly', () => {
    const { component } = setupComponent();
    const result = component.formatCurrency(123456);
    expect(result).toContain('1.234');
    expect(result).toContain('56');
  });
});
