import { Injector, runInInjectionContext, DestroyRef, signal, computed } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { DebtStateService } from '../../core/services/debt-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { PersonDetailComponent } from './person-detail.component';

function createMockState() {
  const persons = signal<any[]>([]);
  const installments = signal<any[]>([]);
  const purchases = signal<any[]>([]);

  const debtByPerson = computed(() => ({}));

  return {
    persons, installments, purchases, debtByPerson,
    setPersons: (v: any[]) => persons.set(v),
    setInstallments: (v: any[]) => installments.set(v),
    setPurchases: (v: any[]) => purchases.set(v),
  };
}

describe('PersonDetailComponent', () => {
  const setupComponent = () => {
    const mockRouter = { navigate: vi.fn() };
    const mockRoute = {
      paramMap: of({ get: (key: string) => 'p1' }),
    };
    const mockState = createMockState();

    const injector = Injector.create({
      providers: [
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: Router, useValue: mockRouter },
        { provide: SettingsService, useValue: { currency: () => 'ARS' } },
        { provide: DebtStateService, useValue: mockState as any },
        DestroyRef,
      ],
    });

    const component = runInInjectionContext(injector, () => new PersonDetailComponent());
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

  it('should return null person when none exists', () => {
    const { component } = setupComponent();
    expect(component.person()).toBeNull();
  });

  it('should return personInstallments as sorted empty array when no data', () => {
    const { component } = setupComponent();
    expect(component.personInstallments()).toEqual([]);
  });

  it('should return personPurchases as empty array when no data', () => {
    const { component } = setupComponent();
    expect(component.personPurchases()).toEqual([]);
  });

  it('should navigate to dashboard on goBack', () => {
    const { component, mockRouter } = setupComponent();
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to purchase with personId query param', () => {
    const { component, mockRouter, mockState } = setupComponent();
    mockState.setPersons([{ id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 }]);
    component.addNewPurchase();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/purchase'], { queryParams: { personId: 'p1' } });
  });

  it('should navigate to payment with person id', () => {
    const { component, mockRouter, mockState } = setupComponent();
    mockState.setPersons([{ id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 }]);
    component.goToPayment();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/payment', 'p1']);
  });

  describe('utility methods', () => {
    it('getStatus should return PAID when fully paid', () => {
      const { component } = setupComponent();
      const inst = {
        id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1,
        amountCents: 10000, amountPaidCents: 10000,
        dueDate: new Date('2024-01-01'),
      };
      expect(component.getStatus(inst)).toBe('PAID');
    });

    it('getStatus should return OVERDUE for past due unpaid', () => {
      const { component } = setupComponent();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 10);
      const inst = {
        id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1,
        amountCents: 10000, amountPaidCents: 0,
        dueDate: yesterday,
      };
      expect(component.getStatus(inst)).toBe('OVERDUE');
    });

    it('getStatus should return FUTURE for far future dates', () => {
      const { component } = setupComponent();
      const future = new Date();
      future.setDate(future.getDate() + 30);
      const inst = {
        id: 'i1', personId: 'p1', purchaseId: 'pur1', number: 1,
        amountCents: 10000, amountPaidCents: 0,
        dueDate: future,
      };
      expect(component.getStatus(inst)).toBe('FUTURE');
    });
  });
});
