import { DebtStateService, DebtAlert } from './debt-state.service';
import { Person, Purchase, Installment, Payment } from '../models/debt.model';
import { NotificationService } from './notification.service';

function createMockNotify(): NotificationService {
  return new NotificationService() as NotificationService;
}

function makePerson(overrides: Partial<Person> = {}): Person {
  return { id: 'p1', name: 'Test', closingDay: 15, dueDay: 5, ...overrides };
}

function makeInstallment(overrides: Partial<Installment> = {}): Installment {
  return {
    id: 'i1',
    purchaseId: 'pur1',
    personId: 'p1',
    number: 1,
    amountCents: 10000,
    amountPaidCents: 0,
    dueDate: new Date(2026, 5, 15),
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pay1',
    personId: 'p1',
    amountCents: 5000,
    paymentDate: new Date(2026, 5, 10),
    ...overrides,
  };
}

describe('DebtStateService', () => {
  let service: DebtStateService;

  beforeEach(() => {
    const notify = createMockNotify();
    service = new DebtStateService(notify);
  });

  describe('initial state', () => {
    it('should have empty signals on creation', () => {
      expect(service.persons()).toEqual([]);
      expect(service.purchases()).toEqual([]);
      expect(service.installments()).toEqual([]);
      expect(service.payments()).toEqual([]);
    });

    it('should compute totalDebt as 0 when no data', () => {
      expect(service.totalDebt()).toBe(0);
    });

    it('should compute recoveryRate as 0 when no installments', () => {
      expect(service.recoveryRate()).toBe(0);
    });

    it('should compute debtHealth as SANA when no alerts', () => {
      expect(service.debtHealth()).toBe('SANA');
    });

    it('should return empty pendingAlerts when no data', () => {
      expect(service.pendingAlerts()).toEqual([]);
    });
  });

  describe('totalDebt', () => {
    it('should calculate totalDebt = sum(installments) - sum(payments)', () => {
      service.setInstallments([
        makeInstallment({ id: 'i1', amountCents: 10000 }),
        makeInstallment({ id: 'i2', amountCents: 20000 }),
      ]);
      service.setPayments([
        makePayment({ id: 'pay1', amountCents: 5000 }),
      ]);

      expect(service.totalDebt()).toBe(25000); // 30000 - 5000
    });

    it('should update reactively when installments change', () => {
      service.setInstallments([makeInstallment({ amountCents: 5000 })]);
      expect(service.totalDebt()).toBe(5000);

      service.setInstallments([
        makeInstallment({ amountCents: 5000 }),
        makeInstallment({ amountCents: 15000 }),
      ]);
      expect(service.totalDebt()).toBe(20000);
    });
  });

  describe('totalRecovered', () => {
    it('should sum all payment amounts', () => {
      service.setPayments([
        makePayment({ amountCents: 3000 }),
        makePayment({ amountCents: 7000 }),
      ]);
      expect(service.totalRecovered()).toBe(10000);
    });
  });

  describe('recoveryRate', () => {
    it('should calculate percentage of total recovered', () => {
      service.setInstallments([makeInstallment({ amountCents: 10000 })]);
      service.setPayments([makePayment({ amountCents: 2500 })]);

      expect(service.recoveryRate()).toBe(25); // (2500 / 10000) * 100
    });

    it('should return 0 when total installments is 0', () => {
      expect(service.recoveryRate()).toBe(0);
    });
  });

  describe('debtByPerson', () => {
    it('should return a map of personId to balance', () => {
      service.setInstallments([
        makeInstallment({ personId: 'p1', amountCents: 10000 }),
        makeInstallment({ personId: 'p2', amountCents: 20000 }),
        makeInstallment({ personId: 'p1', amountCents: 5000 }),
      ]);
      service.setPayments([
        makePayment({ personId: 'p1', amountCents: 3000 }),
      ]);

      const balances = service.debtByPerson();
      expect(balances['p1']).toBe(12000); // 15000 - 3000
      expect(balances['p2']).toBe(20000);
    });
  });

  describe('personsWithBalance', () => {
    it('should enrich persons with their balance', () => {
      service.setPersons([
        makePerson({ id: 'p1', name: 'Juan' }),
        makePerson({ id: 'p2', name: 'María' }),
      ]);
      service.setInstallments([
        makeInstallment({ personId: 'p1', amountCents: 10000 }),
        makeInstallment({ personId: 'p2', amountCents: 20000 }),
      ]);
      service.setPayments([makePayment({ personId: 'p1', amountCents: 3000 })]);

      const withBalance = service.personsWithBalance();
      expect(withBalance).toHaveLength(2);
      expect(withBalance.find((p: any) => p.id === 'p1')?.balance).toBe(7000); // 10000 - 3000
      expect(withBalance.find((p: any) => p.id === 'p2')?.balance).toBe(20000);
    });
  });

  describe('pendingAlerts', () => {
    it('should generate OVERDUE alert for past due installments', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      service.setInstallments([
        makeInstallment({
          id: 'i1',
          amountCents: 5000,
          amountPaidCents: 0,
          dueDate: yesterday,
        }),
      ]);

      const alerts = service.pendingAlerts();
      expect(alerts.some((a: DebtAlert) => a.type === 'OVERDUE')).toBe(true);
    });

    it('should generate CRITICAL alert for installments due today', () => {
      const today = new Date();

      service.setInstallments([
        makeInstallment({
          id: 'i1',
          amountCents: 5000,
          amountPaidCents: 0,
          dueDate: today,
        }),
      ]);

      const alerts = service.pendingAlerts();
      expect(alerts.some((a: DebtAlert) => a.type === 'CRITICAL')).toBe(true);
    });

    it('should not generate alerts when all installments are paid', () => {
      service.setInstallments([
        makeInstallment({ amountPaidCents: 10000 }), // fully paid
      ]);

      const alerts = service.pendingAlerts();
      expect(alerts).toEqual([]);
    });
  });

  describe('debtHealth', () => {
    it('should be CRÍTICA when more than 5 overdue installments', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const overdueInstallments: Installment[] = Array.from({ length: 6 }, (_, i) =>
        makeInstallment({
          id: `overdue-${i}`,
          amountCents: 1000,
          amountPaidCents: 0,
          dueDate: yesterday,
        })
      );

      service.setInstallments(overdueInstallments);
      expect(service.debtHealth()).toBe('CRÍTICA');
    });

    it('should be EN RIESGO when there are overdue installments (≤5)', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      service.setInstallments([
        makeInstallment({
          id: 'i1',
          amountCents: 5000,
          amountPaidCents: 0,
          dueDate: yesterday,
        }),
      ]);

      expect(service.debtHealth()).toBe('EN RIESGO');
    });

    it('should be SANA when no overdue or critical installments', () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);

      service.setInstallments([
        makeInstallment({
          id: 'i1',
          amountCents: 5000,
          amountPaidCents: 0,
          dueDate: future,
        }),
      ]);

      expect(service.debtHealth()).toBe('SANA');
    });
  });

  describe('monthlyInstallments', () => {
    it('should return empty array when no installments', () => {
      expect(service.monthlyInstallments()).toEqual([]);
    });

    it('should group installments by YYYY-MM key with aggregated values', () => {
      service.setInstallments([
        makeInstallment({ id: 'i1', amountCents: 10000, amountPaidCents: 2000, dueDate: new Date(2026, 4, 15) }), // May
        makeInstallment({ id: 'i2', amountCents: 20000, amountPaidCents: 5000, dueDate: new Date(2026, 5, 10) }), // Jun
      ]);

      const result = service.monthlyInstallments();
      expect(result).toHaveLength(2);
      expect(result[0].month).toBe('2026-05');
      expect(result[0].totalCents).toBe(10000);
      expect(result[0].paidCents).toBe(2000);
      expect(result[0].remainingCents).toBe(8000);
      expect(result[0].count).toBe(1);
      expect(result[1].month).toBe('2026-06');
      expect(result[1].totalCents).toBe(20000);
      expect(result[1].remainingCents).toBe(15000);
    });

    it('should combine multiple installments in the same month', () => {
      service.setInstallments([
        makeInstallment({ id: 'i1', amountCents: 10000, amountPaidCents: 1000, dueDate: new Date(2026, 4, 5) }),
        makeInstallment({ id: 'i2', amountCents: 15000, amountPaidCents: 3000, dueDate: new Date(2026, 4, 20) }),
      ]);

      const result = service.monthlyInstallments();
      expect(result).toHaveLength(1);
      expect(result[0].month).toBe('2026-05');
      expect(result[0].totalCents).toBe(25000);
      expect(result[0].paidCents).toBe(4000);
      expect(result[0].remainingCents).toBe(21000);
      expect(result[0].count).toBe(2);
    });

    it('should sort months chronologically', () => {
      service.setInstallments([
        makeInstallment({ id: 'i3', amountCents: 5000, dueDate: new Date(2026, 11, 1) }),  // Dec
        makeInstallment({ id: 'i1', amountCents: 5000, dueDate: new Date(2025, 11, 1) }),  // Dec 2025
        makeInstallment({ id: 'i2', amountCents: 5000, dueDate: new Date(2026, 0, 1) }),   // Jan
      ]);

      const result = service.monthlyInstallments();
      expect(result[0].month).toBe('2025-12');
      expect(result[1].month).toBe('2026-01');
      expect(result[2].month).toBe('2026-12');
    });
  });

  describe('paidByPerson', () => {
    it('should return empty map when no payments', () => {
      expect(service.paidByPerson().size).toBe(0);
    });

    it('should sum payments per person', () => {
      service.setPayments([
        makePayment({ personId: 'p1', amountCents: 10000 }),
        makePayment({ personId: 'p2', amountCents: 20000 }),
        makePayment({ personId: 'p1', amountCents: 5000 }),
      ]);

      const result = service.paidByPerson();
      expect(result.get('p1')).toBe(15000);
      expect(result.get('p2')).toBe(20000);
    });
  });

  describe('personsWithPaid', () => {
    it('should enrich persons with owed and paid amounts', () => {
      service.setPersons([
        makePerson({ id: 'p1', name: 'Juan' }),
        makePerson({ id: 'p2', name: 'María' }),
      ]);
      service.setInstallments([
        makeInstallment({ personId: 'p1', amountCents: 50000, amountPaidCents: 0 }),
        makeInstallment({ personId: 'p2', amountCents: 30000, amountPaidCents: 0 }),
      ]);
      service.setPayments([
        makePayment({ personId: 'p1', amountCents: 10000 }),
        makePayment({ personId: 'p2', amountCents: 30000 }),
      ]);

      const result = service.personsWithPaid();
      expect(result).toHaveLength(2);
      const p1 = result.find(p => p.id === 'p1')!;
      const p2 = result.find(p => p.id === 'p2')!;
      expect(p1.owedCents).toBe(40000); // 50000 - 10000
      expect(p1.paidCents).toBe(10000);
      expect(p2.owedCents).toBe(0); // 30000 - 30000
      expect(p2.paidCents).toBe(30000);
    });

    it('should show 0 owed when person has no installments but has payments', () => {
      service.setPersons([makePerson({ id: 'p1', name: 'Juan' })]);
      service.setPayments([makePayment({ personId: 'p1', amountCents: 5000 })]);

      const result = service.personsWithPaid();
      expect(result[0].owedCents).toBe(0);
      expect(result[0].paidCents).toBe(5000);
    });
  });

  describe('mutations', () => {
    it('should add person via addPerson', () => {
      const person = makePerson();
      service.addPerson(person);
      expect(service.persons()).toHaveLength(1);
      expect(service.persons()[0].id).toBe('p1');
    });

    it('should remove person via removePerson', () => {
      service.addPerson(makePerson());
      service.removePerson('p1');
      expect(service.persons()).toHaveLength(0);
    });

    it('should add purchase and installments', () => {
      service.addPurchase({
        id: 'pur1', personId: 'p1', description: 'Test',
        totalCents: 30000, installmentCount: 3, createdAt: new Date(),
      });
      service.addInstallments([
        makeInstallment({ id: 'i1', number: 1, amountCents: 10000 }),
        makeInstallment({ id: 'i2', number: 2, amountCents: 10000 }),
        makeInstallment({ id: 'i3', number: 3, amountCents: 10000 }),
      ]);

      expect(service.purchases()).toHaveLength(1);
      expect(service.installments()).toHaveLength(3);
      expect(service.totalDebt()).toBe(30000);
    });

    it('should update installment via updateInstallment', () => {
      service.setInstallments([makeInstallment({ amountPaidCents: 0 })]);
      service.updateInstallment(makeInstallment({ amountPaidCents: 3000 }));

      expect(service.installments()[0].amountPaidCents).toBe(3000);
    });

    it('should remove purchases and installments by personId', () => {
      service.setPurchases([
        { id: 'pur1', personId: 'p1', description: 'A', totalCents: 100, installmentCount: 1, createdAt: new Date() },
      ]);
      service.setInstallments([
        makeInstallment({ id: 'i1', personId: 'p1' }),
      ]);

      service.removePurchasesByPersonId('p1');
      service.removeInstallmentsByPersonId('p1');

      expect(service.purchases()).toHaveLength(0);
      expect(service.installments()).toHaveLength(0);
    });
  });
});
