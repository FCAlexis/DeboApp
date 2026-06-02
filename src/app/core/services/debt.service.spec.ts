import { DebtService } from './debt.service';
import { DebtStateService } from './debt-state.service';
import { LocalDbService } from './local-db.service';
import { NotificationService } from './notification.service';
import { Person, Installment, Payment } from '../models/debt.model';
import { CycleEngine } from '../cycle-engine';

/**
 * Creates an in-memory mock LocalDbService for DebtService testing.
 */
function createMockDb(): LocalDbService {
  const stores: Record<string, Map<string, any>> = {
    persons: new Map(),
    purchases: new Map(),
    installments: new Map(),
    payments: new Map(),
  };

  const service = new LocalDbService();
  (service as any).init = async () => null;

  (service as any).getAll = async <T>(storeName: string): Promise<T[]> => {
    return Array.from((stores[storeName] || new Map()).values()) as T[];
  };

  (service as any).put = async (storeName: string, item: any): Promise<void> => {
    const store = stores[storeName];
    if (!store) throw new Error(`Store ${storeName} not found`);
    store.set(item.id, { ...item });
  };

  (service as any).delete = async (storeName: string, id: string): Promise<void> => {
    const store = stores[storeName];
    if (store) store.delete(id);
  };

  // Mock runTransaction for atomic multi-store operations
  (service as any).runTransaction = async (
    storeNames: string[],
    _mode: string,
    action: (tx: { objectStore: (name: string) => any }) => void,
  ): Promise<void> => {
    const mockTx: any = {
      objectStore: (name: string): any => ({
        put: (item: any) => {
          const store = stores[name];
          if (!store) throw new Error(`Store ${name} not found`);
          store.set(item.id, { ...item });
        },
        delete: (id: string) => {
          const store = stores[name];
          if (store) store.delete(id);
        },
      }),
    };
    action(mockTx);
  };

  return service;
}

function createMockNotify(): NotificationService {
  return new NotificationService() as NotificationService;
}

describe('DebtService', () => {
  let db: LocalDbService;
  let state: DebtStateService;
  let service: DebtService;

  beforeEach(() => {
    db = createMockDb();
    const notify = createMockNotify();
    state = new DebtStateService(notify);
    service = new DebtService(db, state);
  });

  describe('addPersonExtended', () => {
    it('should add person to DB and state', async () => {
      await service.addPersonExtended('Juan Pérez', 15, 5);

      // Check state
      expect(state.persons()).toHaveLength(1);
      expect(state.persons()[0].name).toBe('Juan Pérez');
      expect(state.persons()[0].closingDay).toBe(15);
      expect(state.persons()[0].dueDay).toBe(5);

      // Check DB
      const dbPersons = await db.getAll<Person>('persons');
      expect(dbPersons).toHaveLength(1);
      expect(dbPersons[0].name).toBe('Juan Pérez');
    });
  });

  describe('deletePerson', () => {
    it('should delete person and cascade to purchases and installments', async () => {
      const person: Person = {
        id: 'p1', name: 'Test', closingDay: 15, dueDay: 5,
      };

      // Setup state + DB with person, purchase, installments
      await db.put('persons', person);
      state.addPerson(person);

      await db.put('purchases', {
        id: 'pur1', personId: 'p1', description: 'Compra',
        totalCents: 30000, installmentCount: 3, createdAt: new Date(),
      });
      state.setPurchases([{
        id: 'pur1', personId: 'p1', description: 'Compra',
        totalCents: 30000, installmentCount: 3, createdAt: new Date(),
      }]);

      const inst: Installment = {
        id: 'i1', purchaseId: 'pur1', personId: 'p1', number: 1,
        amountCents: 10000, amountPaidCents: 0, dueDate: new Date(),
      };
      await db.put('installments', inst);
      state.setInstallments([inst]);

      await service.deletePerson('p1');

      // Check state cleared
      expect(state.persons()).toHaveLength(0);
      expect(state.purchases()).toHaveLength(0);
      expect(state.installments()).toHaveLength(0);

      // Check DB cleared
      expect(await db.getAll('persons')).toHaveLength(0);
      expect(await db.getAll('purchases')).toHaveLength(0);
      expect(await db.getAll('installments')).toHaveLength(0);
    });
  });

  describe('addPurchase', () => {
    it('should generate installments with correct remainder distribution (SPEC Case 1)', async () => {
      // Setup a person in state
      state.addPerson({
        id: 'p1', name: 'Test', closingDay: 15, dueDay: 5,
      });

      // SPEC Case 1: $100,000 in 3 cuotas
      await service.addPurchase('p1', 'Test Purchase', 100000, 3);

      expect(state.purchases()).toHaveLength(1);
      expect(state.purchases()[0].description).toBe('Test Purchase');
      expect(state.purchases()[0].totalCents).toBe(100000);
      expect(state.purchases()[0].installmentCount).toBe(3);

      // Check installments generated
      const installments = state.installments();
      expect(installments).toHaveLength(3);

      // SPEC: Cuota 1 = 33.334, Cuota 2 = 33.333, Cuota 3 = 33.333
      expect(installments[0].amountCents).toBe(33334);
      expect(installments[1].amountCents).toBe(33333);
      expect(installments[2].amountCents).toBe(33333);

      // Total stored should be $100,000
      const totalGenerated = installments.reduce((sum, i) => sum + i.amountCents, 0);
      expect(totalGenerated).toBe(100000);

      // All installments should have dueDate
      installments.forEach(inst => {
        expect(inst.dueDate).toBeInstanceOf(Date);
        expect(inst.personId).toBe('p1');
        expect(inst.purchaseId).toBe(state.purchases()[0].id);
        expect(inst.amountPaidCents).toBe(0);
      });

      // Verify persisted in DB
      const dbInsts = await db.getAll<Installment>('installments');
      expect(dbInsts).toHaveLength(3);
      const totalDb = dbInsts.reduce((sum, i) => sum + i.amountCents, 0);
      expect(totalDb).toBe(100000);
    });

    it('should throw when person does not exist', async () => {
      await expect(
        service.addPurchase('nonexistent', 'Test', 50000, 3)
      ).rejects.toThrow('La persona no existe');
    });
  });

  describe('registerPayment', () => {
    it('should distribute payment across installments and update state', async () => {
      // Setup: person with a purchase in 2 installments
      state.addPerson({ id: 'p1', name: 'Test', closingDay: 15, dueDay: 5 });

      await service.addPurchase('p1', 'Compra test', 60000, 2);

      // Verify initial state
      expect(state.installments()).toHaveLength(2);
      const initialTotal = state.totalDebt();
      expect(initialTotal).toBe(60000);

      // Register a payment of 30,000 (pays first installment fully)
      const result = await service.registerPayment('p1', 30000);

      expect(result.totalAppliedCents).toBe(30000);
      expect(result.remainingCents).toBe(0);
      expect(result.allocations).toHaveLength(1);

      // First installment should now be paid (30000 paid out of 30000)
      const insts = state.installments();
      expect(insts[0].amountPaidCents).toBe(30000);
      expect(insts[1].amountPaidCents).toBe(0);

      // Total debt should decrease
      expect(state.totalDebt()).toBe(30000);

      // Payment should exist in state
      expect(state.payments()).toHaveLength(1);
      expect(state.payments()[0].amountCents).toBe(30000);

      // Verify persisted in DB
      const dbPayments = await db.getAll<Payment>('payments');
      expect(dbPayments).toHaveLength(1);
      expect(dbPayments[0].amountCents).toBe(30000);
    });

    it('should cascade excess payment to next installment', async () => {
      state.addPerson({ id: 'p1', name: 'Test', closingDay: 15, dueDay: 5 });
      await service.addPurchase('p1', 'Compra test', 60000, 2);

      // Pay 50,000 — should cover first installment (30,000) and partially second (20,000)
      const result = await service.registerPayment('p1', 50000);

      expect(result.totalAppliedCents).toBe(50000);
      expect(result.remainingCents).toBe(0);
      expect(result.allocations).toHaveLength(2);

      const insts = state.installments();
      expect(insts[0].amountPaidCents).toBe(30000); // fully paid
      expect(insts[1].amountPaidCents).toBe(20000); // partially paid

      expect(state.totalDebt()).toBe(10000); // remaining on installment 2
    });
  });

  describe('T1.3 Persistence (save/read/reload cycle)', () => {
    it('should reconstruct state after reload via loadInitialData', async () => {
      // Setup: write person + purchase to the mock DB (via the real service methods)
      await db.put('persons', { id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 });
      state.addPerson({ id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 });
      await service.addPurchase('p1', 'Compra test', 60000, 2);

      // Simulate app reload: create fresh service + state, reuse same mock db
      const freshNotify = createMockNotify();
      const freshState = new DebtStateService(freshNotify);
      const freshService = new DebtService(db, freshState);
      await freshService.loadInitialData();

      // Verify state was reconstructed from DB
      expect(freshState.persons()).toHaveLength(1);
      expect(freshState.persons()[0].name).toBe('Juan');
      expect(freshState.purchases()).toHaveLength(1);
      expect(freshState.purchases()[0].description).toBe('Compra test');
      expect(freshState.installments()).toHaveLength(2);
      expect(freshState.totalDebt()).toBe(60000);
      expect(freshState.totalRecovered()).toBe(0);
    });
  });
});
