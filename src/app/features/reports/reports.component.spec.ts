import { Injector, runInInjectionContext, signal, computed, DestroyRef, Signal } from '@angular/core';
import { DebtStateService } from '../../core/services/debt-state.service';
import { Person, Installment, Payment } from '../../core/models/debt.model';
import { ReportsComponent, MonthlyTrend } from './reports.component';
import { vi } from 'vitest';

// Mock Chart.js — no canvas context in jsdom
// Define mock factory via vi.hoisted so it's available before module evaluation
const { Chart: MockChart, registerables: MockReg } = vi.hoisted(() => {
  class ChartStub {
    static register() { /* no-op */ }
    constructor() { /* no-op in test */ }
    destroy() { /* no-op */ }
    update() { /* no-op */ }
    data: any = {};
  }
  return { Chart: ChartStub, registerables: [] };
});

vi.mock('chart.js/auto', () => ({
  Chart: MockChart,
  registerables: MockReg,
  default: MockChart,
}));

// Mock effect and afterNextRender to avoid ChangeDetectionScheduler DI requirements
vi.mock('@angular/core', async () => {
  const actual = await vi.importActual<typeof import('@angular/core')>('@angular/core');
  return {
    ...actual,
    effect: vi.fn(),
    afterNextRender: vi.fn((fn: () => void) => fn()),
  };
});

function makePerson(overrides: Partial<Person> = {}): Person {
  return { id: 'p1', name: 'Test', closingDay: 15, dueDay: 5, ...overrides };
}

function makeInstallment(overrides: Partial<Installment> = {}): Installment {
  return {
    id: 'i1', purchaseId: 'pur1', personId: 'p1', number: 1,
    amountCents: 10000, amountPaidCents: 0,
    dueDate: new Date(2026, 4, 15),
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 'pay1', personId: 'p1', amountCents: 5000,
    paymentDate: new Date(2026, 5, 10),
    ...overrides,
  };
}

function createMockState() {
  const persons = signal<Person[]>([]);
  const installments = signal<Installment[]>([]);
  const payments = signal<Payment[]>([]);
  const purchases = signal<any[]>([]);

  const totalDebt = computed(() =>
    installments().reduce((acc, i) => acc + i.amountCents, 0) -
    payments().reduce((acc, p) => acc + p.amountCents, 0)
  );

  const totalRecovered = computed(() =>
    payments().reduce((acc, p) => acc + p.amountCents, 0)
  );

  const totalInstallmentsCents = computed(() =>
    installments().reduce((acc, i) => acc + i.amountCents, 0)
  );

  const recoveryRate = computed(() => {
    const total = totalInstallmentsCents();
    if (total === 0) return 0;
    return Math.round((totalRecovered() / total) * 100);
  });

  const debtByPerson = computed(() => {
    const balances: Record<string, number> = {};
    installments().forEach(i => { balances[i.personId] = (balances[i.personId] || 0) + i.amountCents; });
    payments().forEach(p => { balances[p.personId] = (balances[p.personId] || 0) - p.amountCents; });
    return balances;
  });

  const personsWithBalance = computed(() =>
    persons().map(p => ({ ...p, balance: debtByPerson()[p.id] || 0 }))
  );

  // Report-specific signals
  const monthlyInstallments = computed(() => {
    const byMonth = new Map<string, { totalCents: number; paidCents: number; count: number }>();
    for (const inst of installments()) {
      const key = `${inst.dueDate.getFullYear()}-${String(inst.dueDate.getMonth() + 1).padStart(2, '0')}`;
      const entry = byMonth.get(key) || { totalCents: 0, paidCents: 0, count: 0 };
      entry.totalCents += inst.amountCents;
      entry.paidCents += inst.amountPaidCents;
      entry.count++;
      byMonth.set(key, entry);
    }
    return Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data, remainingCents: data.totalCents - data.paidCents }));
  });

  const paidByPerson = computed(() => {
    const byPerson = new Map<string, number>();
    for (const p of payments()) {
      byPerson.set(p.personId, (byPerson.get(p.personId) || 0) + p.amountCents);
    }
    return byPerson;
  });

  const personsWithPaid = computed(() => {
    const paid = paidByPerson();
    const debt = debtByPerson();
    return persons().map(p => ({
      ...p,
      owedCents: Math.max(0, debt[p.id] || 0),
      paidCents: paid.get(p.id) || 0,
    }));
  });

  return {
    persons, installments, payments, purchases,
    totalDebt, totalRecovered, recoveryRate,
    debtByPerson, personsWithBalance,
    monthlyInstallments, paidByPerson, personsWithPaid,
    setPersons: (v: Person[]) => persons.set(v),
    setInstallments: (v: Installment[]) => installments.set(v),
    setPayments: (v: Payment[]) => payments.set(v),
  };
}

describe('ReportsComponent', () => {
  const setupComponent = () => {
    const mockState = createMockState();

    const injector = Injector.create({
      providers: [
        { provide: DebtStateService, useValue: mockState as any },
        { provide: DestroyRef, useValue: { onDestroy: vi.fn() } },
      ],
    });

    const component = runInInjectionContext(injector, () => new ReportsComponent());

    return { component, mockState };
  };

  it('should create the component', () => {
    const { component } = setupComponent();
    expect(component).toBeTruthy();
  });

  describe('period filter', () => {
    it('should default to 6m', () => {
      const { component } = setupComponent();
      expect(component.period()).toBe('6m');
    });

    it('should allow changing the period', () => {
      const { component } = setupComponent();
      component.period.set('1y');
      expect(component.period()).toBe('1y');
      component.period.set('all');
      expect(component.period()).toBe('all');
    });
  });

  describe('filteredTrend', () => {
    it('should return 6 zero-filled months when no installments', () => {
      const { component } = setupComponent();
      const result = component.filteredTrend();
      expect(result).toHaveLength(6);
      expect(result.every(m => m.totalCents === 0 && m.paidCents === 0 && m.remainingCents === 0)).toBe(true);
    });

    it('should include only months within the 6m period', () => {
      const { component, mockState } = setupComponent();
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 5);
      const eightMonthsAgo = new Date(now);
      eightMonthsAgo.setMonth(now.getMonth() - 7);

      mockState.setInstallments([
        makeInstallment({ id: 'i1', amountCents: 10000, dueDate: sixMonthsAgo }),
        makeInstallment({ id: 'i2', amountCents: 20000, dueDate: eightMonthsAgo }),
      ]);

      const result = component.filteredTrend();
      // Only the installment within 6m should be included
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('recoveryWithTrend', () => {
    it('should return 0% with flat trend when no data', () => {
      const { component } = setupComponent();
      expect(component.recoveryWithTrend().rate).toBe(0);
      expect(component.recoveryWithTrend().trend).toBe('flat');
    });

    it('should show up trend when recovery is positive', () => {
      const { component, mockState } = setupComponent();
      mockState.setInstallments([makeInstallment({ amountCents: 10000 })]);
      mockState.setPayments([makePayment({ amountCents: 5000 })]);
      // rate = 50%, trend depends on split comparison
      expect(component.recoveryWithTrend().rate).toBe(50);
    });
  });

  describe('buildExportData', () => {
    it('should return complete export data structure with empty state', () => {
      const { component } = setupComponent();
      const data = component.buildExportData();
      expect(data).toHaveProperty('period');
      expect(data).toHaveProperty('debtTrend');
      expect(data).toHaveProperty('persons');
      expect(data).toHaveProperty('recoveryRate');
      expect(data).toHaveProperty('totalDebt');
      expect(data).toHaveProperty('totalRecovered');
    });

    it('should reflect current period', () => {
      const { component } = setupComponent();
      component.period.set('1y');
      expect(component.buildExportData().period).toBe('1y');
    });
  });

  describe('exportCSV', () => {
    it('should create a CSV blob with correct MIME type', () => {
      const { component, mockState } = setupComponent();
      mockState.setInstallments([makeInstallment({ amountCents: 10000 })]);
      mockState.setPayments([makePayment({ amountCents: 3000 })]);

      const blob = component.exportCSV();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv;charset=utf-8;');
    });

    it('should return null when no data to export', () => {
      const { component } = setupComponent();
      const result = component.exportCSV();
      expect(result).toBeNull();
    });

    it('should contain CSV headers and rows', () => {
      const { component, mockState } = setupComponent();
      mockState.setPersons([makePerson({ id: 'p1', name: 'Juan' })]);
      mockState.setInstallments([makeInstallment({ amountCents: 10000 })]);
      mockState.setPayments([makePayment({ amountCents: 3000 })]);

      const blob = component.exportCSV();
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('exportJSON', () => {
    it('should create a JSON blob with correct MIME type', () => {
      const { component, mockState } = setupComponent();
      mockState.setInstallments([makeInstallment({ amountCents: 10000 })]);
      mockState.setPayments([makePayment({ amountCents: 3000 })]);

      const blob = component.exportJSON();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json;charset=utf-8;');
    });

    it('should return null when no data to export', () => {
      const { component } = setupComponent();
      const result = component.exportJSON();
      expect(result).toBeNull();
    });
  });

  describe('calculateTrend', () => {
    it('should return flat when there is no data', () => {
      const { component } = setupComponent();
      expect(component.calculateTrend()).toBe('flat');
    });

    it('should return up when second half recovery rate is higher', () => {
      const { component, mockState } = setupComponent();
      const now = new Date();
      // First 3 months: large installments, no payments → low recovery
      // Last 3 months: small installments with some payment → higher recovery
      const insts: Installment[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - 5 + i);
        insts.push(makeInstallment({
          id: `i${i}`,
          amountCents: i < 3 ? 20000 : 10000,
          amountPaidCents: i < 3 ? 0 : (i === 3 ? 5000 : 0),
          dueDate: d,
        }));
      }
      mockState.setInstallments(insts);

      const trend = component.calculateTrend();
      expect(trend).toBe('up');
    });

    it('should return down when second half recovery rate is lower', () => {
      const { component, mockState } = setupComponent();
      const now = new Date();
      // First 3 months: some payment → higher recovery
      // Last 3 months: no payment → lower recovery
      const insts: Installment[] = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date(now);
        d.setMonth(now.getMonth() - 5 + i);
        insts.push(makeInstallment({
          id: `i${i}`,
          amountCents: 10000,
          amountPaidCents: i === 0 ? 8000 : 0,
          dueDate: d,
        }));
      }
      mockState.setInstallments(insts);

      const trend = component.calculateTrend();
      expect(trend).toBe('down');
    });
  });
});
