import { Injector, runInInjectionContext, signal, computed, ɵChangeDetectionScheduler } from '@angular/core';
import { Router } from '@angular/router';
import { DebtStateService } from '../../core/services/debt-state.service';
import { PaymentsListComponent } from './payments-list.component';
import { Payment, Person } from '../../core/models/debt.model';

function createMockState() {
  const persons = signal<Person[]>([]);
  const payments = signal<Payment[]>([]);

  const totalRecovered = computed(() =>
    payments().reduce((acc, p) => acc + p.amountCents, 0)
  );

  const globalPaymentHistory = computed(() =>
    payments().map(p => {
      const person = persons().find(per => per.id === p.personId);
      return { ...p, personName: person ? person.name : 'Desconocido' };
    })
  );

  return {
    persons,
    payments,
    purchases: signal([]),
    installments: signal([]),
    totalDebt: computed(() => 0),
    totalRecovered,
    debtByPerson: computed(() => ({})),
    personsWithBalance: computed(() => persons().map(p => ({ ...p, balance: 0 }))),
    recoveryRate: computed(() => 0),
    debtHealth: computed((): 'SANA' | 'EN RIESGO' | 'CRÍTICA' => 'SANA'),
    pendingAlerts: computed(() => []),
    allPendingInstallments: computed(() => []),
    globalPaymentHistory,
    setPersons: (v: Person[]) => persons.set(v),
    setPayments: (v: Payment[]) => payments.set(v),
    setPurchases: () => {},
    setInstallments: () => {},
    addPerson: () => {},
    addPurchase: () => {},
    addInstallments: () => {},
    addPayment: (p: Payment) => payments.update(prev => [...prev, p]),
    removePerson: () => {},
    removePurchasesByPersonId: () => {},
    removeInstallmentsByPersonId: () => {},
    updateInstallment: () => {},
    checkVencimientos: () => {},
  };
}

describe('PaymentsListComponent', () => {
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

    const component = runInInjectionContext(injector, () => new PaymentsListComponent());
    return { component, mockRouter, state };
  };

  it('should create the component', () => {
    const { component } = setupComponent();
    expect(component).toBeTruthy();
  });

  describe('searchTerm', () => {
    it('should default to empty string', () => {
      const { component } = setupComponent();
      expect(component.searchTerm()).toBe('');
    });
  });

  describe('filteredPayments', () => {
    it('should return all payments when search term is empty', () => {
      const { component, state } = setupComponent();

      state.setPersons([{ id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 }]);
      state.setPayments([
        { id: 'pay1', personId: 'p1', amountCents: 5000, paymentDate: new Date() },
        { id: 'pay2', personId: 'p1', amountCents: 3000, paymentDate: new Date() },
      ]);

      expect(component.filteredPayments()).toHaveLength(2);
    });

    it('should filter by person name', () => {
      const { component, state } = setupComponent();

      state.setPersons([
        { id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 },
        { id: 'p2', name: 'María', closingDay: 20, dueDay: 10 },
      ]);
      state.setPayments([
        { id: 'pay1', personId: 'p1', amountCents: 5000, paymentDate: new Date() },
        { id: 'pay2', personId: 'p2', amountCents: 7000, paymentDate: new Date() },
      ]);

      // Simulate typing "mar" in search
      const inputEvent = { target: { value: 'mar' } } as any;
      component.updateSearch(inputEvent);

      const filtered = component.filteredPayments();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].personName).toBe('María');
    });

    it('should return empty array when search matches nothing', () => {
      const { component, state } = setupComponent();

      state.setPersons([{ id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 }]);
      state.setPayments([
        { id: 'pay1', personId: 'p1', amountCents: 5000, paymentDate: new Date() },
      ]);

      const inputEvent = { target: { value: 'zzzzz' } } as any;
      component.updateSearch(inputEvent);

      expect(component.filteredPayments()).toHaveLength(0);
    });
  });

  describe('utility methods', () => {
    it('formatCurrency should format cents', () => {
      const { component } = setupComponent();
      expect(component.formatCurrency(123456)).toContain('1.234');
    });

    it('formatDate should return a formatted date string', () => {
      const { component } = setupComponent();
      const date = new Date(2026, 4, 15);
      const result = component.formatDate(date);
      expect(result).toContain('15');
    });

    it('getMonthName should return abbreviated month', () => {
      const { component } = setupComponent();
      const date = new Date(2026, 0, 15);
      expect(component.getMonthName(date)).toBe('ENE');
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
