import { Injector, runInInjectionContext, signal, computed, ɵChangeDetectionScheduler } from '@angular/core';
import { Router } from '@angular/router';
import { DebtService } from '../../core/services/debt.service';
import { DebtStateService } from '../../core/services/debt-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { LocalDbService } from '../../core/services/local-db.service';
import { NotificationService } from '../../core/services/notification.service';
import { PersonsComponent } from './persons.component';
import { Person } from '../../core/models/debt.model';

function createMockState() {
  const persons = signal<Person[]>([]);
  const purchases = signal<any[]>([]);
  const installments = signal<any[]>([]);
  const payments = signal<any[]>([]);

  return {
    persons,
    purchases,
    installments,
    payments,
    setPersons: (v: Person[]) => persons.set(v),
    addPerson: (p: Person) => persons.update(prev => [...prev, p]),
    removePerson: (id: string) => persons.update(prev => prev.filter(p => p.id !== id)),
    totalDebt: computed(() => 0),
    totalRecovered: computed(() => 0),
    debtByPerson: computed(() => ({})),
    personsWithBalance: computed(() => persons().map(p => ({ ...p, balance: 0 }))),
    recoveryRate: computed(() => 0),
    debtHealth: computed((): 'SANA' | 'EN RIESGO' | 'CRÍTICA' => 'SANA'),
    pendingAlerts: computed(() => []),
    allPendingInstallments: computed(() => []),
    globalPaymentHistory: computed(() => []),
    setPurchases: () => {},
    setInstallments: () => {},
    setPayments: () => {},
    addPurchase: () => {},
    addInstallments: () => {},
    addPayment: () => {},
    removePurchasesByPersonId: () => {},
    removeInstallmentsByPersonId: () => {},
    updateInstallment: () => {},
    checkVencimientos: () => {},
  };
}

describe('PersonsComponent', () => {
  const setupComponent = () => {
    const mockRouter = { navigate: vi.fn() };
    const state = createMockState();
    const mockDebtService = {
      addPersonExtended: vi.fn().mockResolvedValue(undefined),
      addPerson: vi.fn(),
      deletePerson: vi.fn().mockResolvedValue(undefined),
      addPurchase: vi.fn(),
      registerPayment: vi.fn(),
      loadInitialData: vi.fn(),
    };

    const injector = Injector.create({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: DebtStateService, useValue: state as any },
        { provide: DebtService, useValue: mockDebtService },
        { provide: SettingsService, useValue: { defaultClosingDay: () => 15, defaultDueDay: () => 5 } },
        { provide: LocalDbService, useValue: {} },
        { provide: NotificationService, useValue: { show: vi.fn(), error: vi.fn(), info: vi.fn() } },
        { provide: ɵChangeDetectionScheduler, useValue: { notify: () => {} } },
      ],
    });

    const component = runInInjectionContext(injector, () => new PersonsComponent());
    return { component, mockRouter, mockDebtService, state };
  };

  it('should create the component', () => {
    const { component } = setupComponent();
    expect(component).toBeTruthy();
  });

  it('should have a newPerson object with defaults', () => {
    const { component } = setupComponent();
    expect(component.newPerson).toEqual({
      name: '',
      closingDay: 15,
      dueDay: 5,
    });
  });

  describe('savePerson', () => {
    it('should call debtService.addPersonExtended with form values', async () => {
      const { component, mockDebtService } = setupComponent();

      component.newPerson.name = 'María';
      component.newPerson.closingDay = 20;
      component.newPerson.dueDay = 10;

      await component.savePerson();

      expect(mockDebtService.addPersonExtended).toHaveBeenCalledWith('María', 20, 10);
    });

    it('should reset form after successful save', async () => {
      const { component } = setupComponent();

      component.newPerson.name = 'Test';
      await component.savePerson();

      expect(component.newPerson).toEqual({
        name: '',
        closingDay: 15,
        dueDay: 5,
      });
    });
  });

  describe('deletePerson', () => {
    it('should call debtService.deletePerson with the id', async () => {
      const { component, mockDebtService } = setupComponent();

      await component.deletePerson('p1');

      expect(mockDebtService.deletePerson).toHaveBeenCalledWith('p1');
    });
  });

  describe('goBack', () => {
    it('should navigate to dashboard', () => {
      const { component, mockRouter } = setupComponent();

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
