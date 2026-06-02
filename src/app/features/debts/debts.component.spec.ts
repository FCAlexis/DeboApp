import { Injector, runInInjectionContext, signal, computed, ɵChangeDetectionScheduler } from '@angular/core';
import { Router } from '@angular/router';
import { DebtStateService } from '../../core/services/debt-state.service';
import { DebtsComponent } from './debts.component';
import { Installment, Person } from '../../core/models/debt.model';

function createMockState() {
  const persons = signal<Person[]>([]);
  const installments = signal<Installment[]>([]);

  const totalDebt = computed(() =>
    installments().reduce((acc, i) => acc + i.amountCents, 0)
  );

  const debtHealth = computed((): 'SANA' | 'EN RIESGO' | 'CRÍTICA' => {
    const now = new Date();
    const overdue = installments().filter(i => i.dueDate < now && (i.amountPaidCents || 0) < i.amountCents);
    if (overdue.length > 5) return 'CRÍTICA';
    if (overdue.length > 0) return 'EN RIESGO';
    return 'SANA';
  });

  const allPendingInstallments = computed(() =>
    installments()
      .filter(i => (i.amountPaidCents || 0) < i.amountCents)
      .map(i => {
        const person = persons().find(p => p.id === i.personId);
        return { ...i, personName: person ? person.name : 'Desconocido' };
      })
  );

  return {
    persons, installments,
    purchases: signal([]),
    payments: signal([]),
    totalDebt,
    totalRecovered: computed(() => 0),
    debtByPerson: computed(() => ({})),
    personsWithBalance: computed(() => persons().map(p => ({ ...p, balance: 0 }))),
    recoveryRate: computed(() => 0),
    debtHealth,
    pendingAlerts: computed(() => []),
    allPendingInstallments,
    globalPaymentHistory: computed(() => []),
    setPersons: (v: Person[]) => persons.set(v),
    setInstallments: (v: Installment[]) => installments.set(v),
    setPurchases: () => {},
    setPayments: () => {},
    addPerson: () => {},
    addPurchase: () => {},
    addInstallments: () => {},
    addPayment: () => {},
    removePerson: () => {},
    removePurchasesByPersonId: () => {},
    removeInstallmentsByPersonId: () => {},
    updateInstallment: () => {},
    checkVencimientos: () => {},
  };
}

describe('DebtsComponent', () => {
  const setupComponent = () => {
    const mockRouter = { navigate: vi.fn() };
    const state = createMockState();

    const injector = Injector.create({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: DebtStateService, useValue: state as any },
        { provide: ɵChangeDetectionScheduler, useValue: { notify: () => {} } },
      ],
    });

    const component = runInInjectionContext(injector, () => new DebtsComponent());
    return { component, mockRouter, state };
  };

  it('should create the component', () => {
    const { component } = setupComponent();
    expect(component).toBeTruthy();
  });

  describe('filter', () => {
    it('should default to ALL filter', () => {
      const { component } = setupComponent();
      expect(component.filter()).toBe('ALL');
    });

    it('should change filter via setFilter', () => {
      const { component } = setupComponent();

      component.setFilter('OVERDUE');
      expect(component.filter()).toBe('OVERDUE');

      component.setFilter('PENDING');
      expect(component.filter()).toBe('PENDING');

      component.setFilter('ALL');
      expect(component.filter()).toBe('ALL');
    });
  });

  describe('filteredDebts', () => {
    it('should return all installments when filter is ALL', () => {
      const { component, state } = setupComponent();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      state.setPersons([{ id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 }]);
      state.setInstallments([
        { id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1, amountCents: 10000, amountPaidCents: 0, dueDate: yesterday },
        { id: 'i2', personId: 'p1', purchaseId: 'pur1', number: 2, amountCents: 10000, amountPaidCents: 0, dueDate: tomorrow },
      ]);

      expect(component.filteredDebts()).toHaveLength(2);
    });

    it('should return only overdue when filter is OVERDUE', () => {
      const { component, state } = setupComponent();
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      state.setPersons([{ id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 }]);
      state.setInstallments([
        { id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1, amountCents: 10000, amountPaidCents: 0, dueDate: yesterday },
        { id: 'i2', personId: 'p1', purchaseId: 'pur1', number: 2, amountCents: 10000, amountPaidCents: 0, dueDate: tomorrow },
      ]);

      component.setFilter('OVERDUE');
      expect(component.filteredDebts()).toHaveLength(1);
      expect(component.filteredDebts()[0].id).toBe('i1');
    });

    it('should return empty when filter is OVERDUE and nothing is overdue', () => {
      const { component } = setupComponent();
      component.setFilter('OVERDUE');
      expect(component.filteredDebts()).toHaveLength(0);
    });
  });

  describe('utility methods', () => {
    it('formatCurrency should format cents', () => {
      const { component } = setupComponent();
      const result = component.formatCurrency(123456);
      expect(result).toContain('1.234');
    });

    it('getMonthName should return abbreviated month name', () => {
      const { component } = setupComponent();
      const date = new Date(2026, 0, 15);
      expect(component.getMonthName(date)).toBe('ENE');
    });

    it('getStatusLabel should return Vencida for past dates', () => {
      const { component } = setupComponent();
      const past = new Date();
      past.setDate(past.getDate() - 5);
      expect(component.getStatusLabel({ dueDate: past })).toBe('Vencida');
    });

    it('getStatusLabel should return Pendiente for future dates', () => {
      const { component } = setupComponent();
      const future = new Date();
      future.setDate(future.getDate() + 5);
      expect(component.getStatusLabel({ dueDate: future })).toBe('Pendiente');
    });

    it('goBack should navigate to dashboard', () => {
      const { component, mockRouter } = setupComponent();
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('goToPerson should navigate to person detail', () => {
      const { component, mockRouter } = setupComponent();
      component.goToPerson('p1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/person', 'p1']);
    });
  });
});
