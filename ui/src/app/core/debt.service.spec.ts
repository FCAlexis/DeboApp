import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DebtService } from './debt.service';
import { LocalDbService } from './services/local-db.service';
import { DebtStateService } from './debt-state.service';

describe('DebtService Integration', () => {
  let service: DebtService;
  let mockDb: any;
  let mockState: any;

  beforeEach(() => {
    mockDb = {
      put: vi.fn().mockResolvedValue(undefined),
      getAll: vi.fn().mockResolvedValue([]),
    };
    mockState = {
      updatePersons: vi.fn(),
      updatePurchases: vi.fn(),
      updateInstallments: vi.fn(),
      updatePayments: vi.fn(),
    };
    service = new DebtService(mockDb, mockState);
  });

  it('should generate installments with correct cycle-based due dates', async () => {
    // GIVEN a person with closingDay 15 and dueDay 5
    const personId = 'person-1';
    const mockPerson = { 
      id: personId, 
      name: 'Test Person', 
      closingDay: 15, 
      dueDay: 5 
    };
    mockDb.getAll.mockImplementation(async (table: string) => {
      if (table === 'persons') return [mockPerson];
      return [];
    });

    // WHEN a purchase is made on April 10, 2026
    // We mock the "now" date if possible, or we just rely on the fact that 
    // the service uses new Date() which is currently April 2026 in our tests.
    // To be safe, we can't easily mock new Date() without vi.setSystemTime.
    
    // For this test, let's assume today is April 10, 2026
    vi.setSystemTime(new Date(2026, 3, 10));

    await service.addPurchase(personId, 'Grocery', 10000, 2);

    // THEN it should generate 2 installments
    // Purchase April 10 -> Closure April 15 -> Due May 5, June 5.
    const installmentsPut = mockDb.put.mock.calls
      .filter(call => call[0] === 'installments')
      .map(call => call[1]);

    expect(installmentsPut).toHaveLength(2);
    
    const firstInst = installmentsPut[0];
    expect(firstInst.dueDate.getFullYear()).toBe(2026);
    expect(firstInst.dueDate.getMonth()).toBe(4); // May
    expect(firstInst.dueDate.getDate()).toBe(5);

    const secondInst = installmentsPut[1];
    expect(secondInst.dueDate.getFullYear()).toBe(2026);
    expect(secondInst.dueDate.getMonth()).toBe(5); // June
    expect(secondInst.dueDate.getDate()).toBe(5);
  });
});
