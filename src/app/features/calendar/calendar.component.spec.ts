import { signal, computed, Injector, runInInjectionContext } from '@angular/core';
import { CalendarComponent } from './calendar.component';
import { DebtStateService } from '../../core/services/debt-state.service';
import { Installment, Person } from '../../core/models/debt.model';
import { describe, it, expect } from 'vitest';
import { subDays, addDays } from 'date-fns';

function createMockState() {
  const persons = signal<Person[]>([]);
  const installments = signal<Installment[]>([]);
  const payments = signal<any[]>([]);
  const purchases = signal<any[]>([]);

  const allPendingInstallments = computed(() => {
    const ps = persons();
    return installments()
      .filter(i => i.amountPaidCents < i.amountCents)
      .map(i => {
        const person = ps.find(p => p.id === i.personId);
        return { ...i, personName: person ? person.name : 'Desconocido' };
      });
  });

  return {
    persons,
    installments,
    payments,
    purchases,
    allPendingInstallments,
    totalDebt: computed(() => 0),
    totalRecovered: computed(() => 0),
    recoveryRate: computed(() => 0),
    debtHealth: computed(() => 'SANA' as const),
    debtByPerson: computed(() => ({}) as Record<string, number>),
    personsWithBalance: computed(() => persons().map(p => ({ ...p, balance: 0 }))),
    pendingAlerts: computed(() => [] as any[]),
    globalPaymentHistory: computed(() => [] as any[]),
    setPersons: (v: Person[]) => persons.set(v),
    setInstallments: (v: Installment[]) => installments.set(v),
    setPayments: (v: any[]) => payments.set(v),
    addPerson: (p: Person) => persons.update(prev => [...prev, p]),
    addInstallments: (insts: Installment[]) => installments.update(prev => [...prev, ...insts]),
    addPayment: (p: any) => payments.update(prev => [...prev, p]),
    addPurchase: (p: any) => purchases.update(prev => [...prev, p]),
    removePerson: (id: string) => persons.update(prev => prev.filter(p => p.id !== id)),
    removePurchasesByPersonId: () => {},
    removeInstallmentsByPersonId: () => {},
    updateInstallment: (inst: Installment) => installments.update(prev => prev.map(i => i.id === inst.id ? inst : i)),
    checkVencimientos: () => {},
  };
}

function makeInstallment(overrides: Partial<Installment> = {}): Installment {
  return {
    id: 'i1',
    purchaseId: 'pur1',
    personId: 'p1',
    number: 1,
    amountCents: 10000,
    amountPaidCents: 0,
    dueDate: new Date(),
    ...overrides,
  };
}

function makePerson(overrides: Partial<Person> = {}): Person {
  return { id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5, ...overrides };
}

describe('CalendarComponent', () => {
  const setupComponent = () => {
    const mockState = createMockState();

    const injector = Injector.create({
      providers: [
        { provide: DebtStateService, useValue: mockState as any },
      ],
    });

    const component = runInInjectionContext(injector, () => new CalendarComponent());
    return { component, mockState };
  };

  describe('computed: events', () => {
    it('should return empty array when no installments', () => {
      const { component } = setupComponent();
      expect(component.events()).toEqual([]);
    });

    it('should map each pending installment to a CalendarEvent', () => {
      const { component, mockState } = setupComponent();
      mockState.setPersons([makePerson()]);
      mockState.setInstallments([
        makeInstallment({ id: 'i1', amountCents: 10000, amountPaidCents: 0, dueDate: addDays(new Date(), 10) }),
      ]);

      const events = component.events();
      expect(events).toHaveLength(1);
      expect(events[0].title).toContain('Juan');
      expect(events[0].title).toContain('100');
      expect(events[0].color).toBeDefined();
      expect(events[0].meta.status).toBe('future');
    });

    it('should exclude fully paid installments', () => {
      const { component, mockState } = setupComponent();
      mockState.setPersons([makePerson()]);
      mockState.setInstallments([
        makeInstallment({ id: 'i1', amountCents: 10000, amountPaidCents: 10000, dueDate: addDays(new Date(), 10) }),
      ]);

      expect(component.events()).toHaveLength(0);
    });
  });

  describe('computed: events — color mapping', () => {
    it('should mark overdue installments as red', () => {
      const { component, mockState } = setupComponent();
      mockState.setPersons([makePerson()]);
      mockState.setInstallments([
        makeInstallment({ id: 'i1', dueDate: subDays(new Date(), 5) }),
      ]);

      const events = component.events();
      expect(events[0].meta.status).toBe('overdue');
      expect(events[0].color?.primary).toBe('#ef4444');
    });

    it('should mark installments due within 3 days as amber', () => {
      const { component, mockState } = setupComponent();
      mockState.setPersons([makePerson()]);
      mockState.setInstallments([
        makeInstallment({ id: 'i1', dueDate: addDays(new Date(), 2) }),
      ]);

      const events = component.events();
      expect(events[0].meta.status).toBe('soon');
      expect(events[0].color?.primary).toBe('#f59e0b');
    });

    it('should mark future installments as green', () => {
      const { component, mockState } = setupComponent();
      mockState.setPersons([makePerson()]);
      mockState.setInstallments([
        makeInstallment({ id: 'i1', dueDate: addDays(new Date(), 10) }),
      ]);

      const events = component.events();
      expect(events[0].meta.status).toBe('future');
      expect(events[0].color?.primary).toBe('#22c55e');
    });
  });

  describe('computed: summaryText', () => {
    it('should return empty state when no installments', () => {
      const { component } = setupComponent();
      expect(component.summaryText()).toBe('No hay cuotas pendientes');
    });

    it('should count overdue installments', () => {
      const { component, mockState } = setupComponent();
      mockState.setPersons([makePerson()]);
      mockState.setInstallments([
        makeInstallment({ id: 'i1', dueDate: subDays(new Date(), 5) }),
        makeInstallment({ id: 'i2', dueDate: subDays(new Date(), 1) }),
      ]);

      const text = component.summaryText();
      expect(text).toContain('2 vencidas');
    });

    it('should count upcoming installments within 30 days', () => {
      const { component, mockState } = setupComponent();
      mockState.setPersons([makePerson()]);
      mockState.setInstallments([
        makeInstallment({ id: 'i1', dueDate: addDays(new Date(), 5) }),
        makeInstallment({ id: 'i2', dueDate: addDays(new Date(), 20) }),
      ]);

      const text = component.summaryText();
      expect(text).toContain('2 próximas en 30 días');
    });

    it('should combine overdue and upcoming counts', () => {
      const { component, mockState } = setupComponent();
      mockState.setPersons([makePerson()]);
      mockState.setInstallments([
        makeInstallment({ id: 'i1', dueDate: subDays(new Date(), 1) }),
        makeInstallment({ id: 'i2', dueDate: addDays(new Date(), 5) }),
      ]);

      const text = component.summaryText();
      expect(text).toContain('1 vencida');
      expect(text).toContain('1 próxima en 30 días');
    });
  });

  describe('methods', () => {
    it('should navigate to previous month and close day panel', () => {
      const { component } = setupComponent();
      const initial = component.viewDate();
      component.previousMonth();
      expect(component.viewDate().getMonth()).toBe(
        initial.getMonth() === 0 ? 11 : initial.getMonth() - 1
      );
      expect(component.activeDayIsOpen()).toBe(false);
    });

    it('should navigate to next month and close day panel', () => {
      const { component } = setupComponent();
      const initial = component.viewDate();
      component.nextMonth();
      expect(component.viewDate().getMonth()).toBe(
        initial.getMonth() === 11 ? 0 : initial.getMonth() + 1
      );
      expect(component.activeDayIsOpen()).toBe(false);
    });

    it('should go to today and close day panel', () => {
      const { component } = setupComponent();
      component.viewDate.set(new Date(2025, 5, 15));
      component.goToday();
      const today = new Date();
      expect(component.viewDate().getMonth()).toBe(today.getMonth());
      expect(component.viewDate().getFullYear()).toBe(today.getFullYear());
      expect(component.activeDayIsOpen()).toBe(false);
    });
  });

  describe('smoke test', () => {
    it('should create the component via DI', () => {
      const { component } = setupComponent();
      expect(component).toBeTruthy();
    });
  });
});
