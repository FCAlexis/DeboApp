import { Injector, runInInjectionContext, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DebtStateService } from '../../core/services/debt-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { NotificationService } from '../../core/services/notification.service';
import { LocalDbService } from '../../core/services/local-db.service';
import { DashboardComponent } from './dashboard.component';
import { Installment, Person } from '../../core/models/debt.model';
import { vi } from 'vitest';

// Mock Chart.js — no canvas context in jsdom
vi.mock('chart.js/auto', () => ({
  default: class ChartMock {
    constructor() { /* no-op in test */ }
    update() { /* no-op */ }
    data: any = {};
  },
}));

// Mock effect() so it doesn't need ChangeDetectionScheduler/EffectScheduler DI tokens
vi.mock('@angular/core', async () => {
  const actual = await vi.importActual<typeof import('@angular/core')>('@angular/core');
  return {
    ...actual,
    effect: vi.fn(),
  };
});

function createMockState() {
  const persons = signal<Person[]>([]);
  const installments = signal<Installment[]>([]);
  const payments = signal<any[]>([]);
  const purchases = signal<any[]>([]);

  const totalDebt = computed(() =>
    installments().reduce((acc, i) => acc + i.amountCents, 0) -
    payments().reduce((acc, p) => acc + p.amountCents, 0)
  );

  const totalRecovered = computed(() =>
    payments().reduce((acc, p) => acc + p.amountCents, 0)
  );

  const debtByPerson = computed(() => {
    const balances: Record<string, number> = {};
    installments().forEach(i => { balances[i.personId] = (balances[i.personId] || 0) + i.amountCents; });
    payments().forEach(p => { balances[p.personId] = (balances[p.personId] || 0) - p.amountCents; });
    return balances;
  });

  const personsWithBalance = computed(() =>
    persons().map(p => ({ ...p, balance: debtByPerson()[p.id] || 0 }))
  );

  const recoveryRate = computed(() => {
    const total = installments().reduce((acc, i) => acc + i.amountCents, 0);
    if (total === 0) return 0;
    return Math.round((totalRecovered() / total) * 100);
  });

  const debtHealth = computed((): 'SANA' | 'EN RIESGO' | 'CRÍTICA' => {
    const overdue = installments().filter(i => {
      const now = new Date();
      return i.dueDate < now && (i.amountPaidCents || 0) < i.amountCents;
    });
    if (overdue.length > 5) return 'CRÍTICA';
    if (overdue.length > 0) return 'EN RIESGO';
    return 'SANA';
  });

  const pendingAlerts = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allPending = installments().filter(i => (i.amountPaidCents || 0) < i.amountCents);
    const overdueItems = allPending.filter(i => new Date(i.dueDate) < today);
    const criticalItems = allPending.filter(i => new Date(i.dueDate).getTime() === today.getTime());
    const warningItems = allPending.filter(i => {
      const diff = new Date(i.dueDate).getTime() - today.getTime();
      return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000;
    });

    const alerts: any[] = [];
    if (overdueItems.length > 0) alerts.push({ type: 'OVERDUE', installments: overdueItems, message: '' });
    if (criticalItems.length > 0) alerts.push({ type: 'CRITICAL', installments: criticalItems, message: '' });
    if (warningItems.length > 0) alerts.push({ type: 'WARNING', installments: warningItems, message: '' });
    return alerts;
  });

  const allPendingInstallments = computed(() =>
    installments().filter(i => (i.amountPaidCents || 0) < i.amountCents)
      .map(i => {
        const person = persons().find(p => p.id === i.personId);
        return { ...i, personName: person ? person.name : 'Desconocido' };
      })
  );

  const globalPaymentHistory = computed(() =>
    payments().map(p => {
      const person = persons().find(per => per.id === p.personId);
      return { ...p, personName: person ? person.name : 'Desconocido' };
    })
  );

  return {
    persons, installments, payments, purchases,
    totalDebt, totalRecovered, debtByPerson, personsWithBalance,
    recoveryRate, debtHealth, pendingAlerts, allPendingInstallments,
    globalPaymentHistory,
    setPersons: (v: Person[]) => persons.set(v),
    setInstallments: (v: Installment[]) => installments.set(v),
    setPayments: (v: any[]) => payments.set(v),
    addPerson: (p: Person) => persons.update(prev => [...prev, p]),
    addPayment: (p: any) => payments.update(prev => [...prev, p]),
    addPurchase: (p: any) => purchases.update(prev => [...prev, p]),
    addInstallments: (insts: Installment[]) => installments.update(prev => [...prev, ...insts]),
    removePerson: (id: string) => persons.update(prev => prev.filter(p => p.id !== id)),
    removePurchasesByPersonId: () => {},
    removeInstallmentsByPersonId: () => {},
    updateInstallment: (inst: Installment) => installments.update(prev => prev.map(i => i.id === inst.id ? inst : i)),
    checkVencimientos: () => {},
  };
}

describe('DashboardComponent', () => {
  const setupComponent = () => {
    const mockRouter = { navigate: vi.fn() };
    const mockState = createMockState();

    const injector = Injector.create({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: DebtStateService, useValue: mockState as any },
        { provide: SettingsService, useValue: { currency: () => 'ARS' } },
        { provide: LocalDbService, useValue: {} },
        { provide: NotificationService, useValue: { show: vi.fn(), error: vi.fn(), info: vi.fn() } },
      ],
    });

    const component = runInInjectionContext(injector, () => new DashboardComponent());

    // Manually call AfterViewInit (charts won't render in jsdom)
    if (typeof component.ngAfterViewInit === 'function') {
      component.ngAfterViewInit();
    }

    return { component, mockRouter, mockState };
  };

  it('should create the component', () => {
    const { component } = setupComponent();
    expect(component).toBeTruthy();
  });

  describe('computed: overdueTotal', () => {
    it('should return 0 when no installments are overdue', () => {
      const { component } = setupComponent();
      expect(component.overdueTotal()).toBe(0);
    });

    it('should sum pending amounts of overdue installments', () => {
      const { component, mockState } = setupComponent();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      mockState.setInstallments([
        { id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1, amountCents: 10000, amountPaidCents: 0, dueDate: yesterday },
        { id: 'i2', personId: 'p1', purchaseId: 'pur1', number: 2, amountCents: 5000, amountPaidCents: 2000, dueDate: yesterday },
        { id: 'i3', personId: 'p1', purchaseId: 'pur1', number: 3, amountCents: 5000, amountPaidCents: 0, dueDate: tomorrow },
      ]);

      expect(component.overdueTotal()).toBe(13000);
    });
  });

  describe('computed: overdueCount', () => {
    it('should return 0 when nothing is overdue', () => {
      const { component } = setupComponent();
      expect(component.overdueCount()).toBe(0);
    });

    it('should count overdue installments', () => {
      const { component, mockState } = setupComponent();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      mockState.setInstallments([
        { id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1, amountCents: 5000, amountPaidCents: 0, dueDate: yesterday },
        { id: 'i2', personId: 'p1', purchaseId: 'pur1', number: 2, amountCents: 5000, amountPaidCents: 5000, dueDate: yesterday },
        { id: 'i3', personId: 'p1', purchaseId: 'pur1', number: 3, amountCents: 5000, amountPaidCents: 0, dueDate: yesterday },
      ]);

      expect(component.overdueCount()).toBe(2);
    });
  });

  describe('computed: comingSoonTotal', () => {
    it('should return 0 when no installments due within 30 days', () => {
      const { component } = setupComponent();
      expect(component.comingSoonTotal()).toBe(0);
    });

    it('should sum installments due within next 30 days', () => {
      const { component, mockState } = setupComponent();
      const today = new Date();
      const in10Days = new Date(today);
      in10Days.setDate(today.getDate() + 10);
      const in40Days = new Date(today);
      in40Days.setDate(today.getDate() + 40);

      mockState.setInstallments([
        { id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1, amountCents: 15000, amountPaidCents: 0, dueDate: in10Days },
        { id: 'i2', personId: 'p1', purchaseId: 'pur1', number: 2, amountCents: 15000, amountPaidCents: 0, dueDate: in40Days },
      ]);

      expect(component.comingSoonTotal()).toBe(15000);
    });
  });

  describe('computed: nextPayment', () => {
    it('should return null when no pending installments', () => {
      const { component } = setupComponent();
      expect(component.nextPayment()).toBeNull();
    });

    it('should return the earliest pending installment with person info', () => {
      const { component, mockState } = setupComponent();
      const today = new Date();
      const in5Days = new Date(today);
      in5Days.setDate(today.getDate() + 5);
      const in10Days = new Date(today);
      in10Days.setDate(today.getDate() + 10);

      mockState.setPersons([{ id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 }]);
      mockState.setInstallments([
        { id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1, amountCents: 10000, amountPaidCents: 0, dueDate: in10Days },
        { id: 'i2', personId: 'p1', purchaseId: 'pur1', number: 2, amountCents: 20000, amountPaidCents: 0, dueDate: in5Days },
      ]);

      expect(component.nextPayment()).not.toBeNull();
      expect(component.nextPayment()?.personName).toBe('Juan');
      expect(component.nextPayment()?.amountCents).toBe(20000);
      expect(component.nextPayment()?.personId).toBe('p1');
    });
  });

  describe('utility methods', () => {
    it('goToDetails should navigate to person detail', () => {
      const { component, mockRouter } = setupComponent();
      component.goToDetails('p1');
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/person', 'p1']);
    });

    it('goToDebts should navigate to debts', () => {
      const { component, mockRouter } = setupComponent();
      component.goToDebts();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/debts']);
    });

    it('addPurchase should navigate to purchase form', () => {
      const { component, mockRouter } = setupComponent();
      component.addPurchase();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/purchase']);
    });
  });
});
