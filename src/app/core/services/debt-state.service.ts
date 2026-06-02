import { Injectable, signal, computed } from '@angular/core';
import { Person, Purchase, Installment, Payment } from '../models/debt.model';
import { NotificationService } from './notification.service';

export interface DebtAlert {
  type: 'CRITICAL' | 'WARNING' | 'OVERDUE';
  installments: Installment[];
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DebtStateService {
  // --- Writables (Sources of Truth) ---
  persons = signal<Person[]>([]);
  purchases = signal<Purchase[]>([]);
  installments = signal<Installment[]>([]);
  payments = signal<Payment[]>([]);

  constructor(
    private notify: NotificationService
  ) {}

  // --- Computed (Reactive Derivations) ---

  // Total global que se debe actualmente
  totalDebt = computed(() => {
    const totalInstallments = this.installments().reduce((acc, i) => acc + i.amountCents, 0);
    const totalPayments = this.payments().reduce((acc, p) => acc + p.amountCents, 0);
    return totalInstallments - totalPayments;
  });

  // Total recuperado (Suma de todos los pagos realizados)
  totalRecovered = computed(() => {
    return this.payments().reduce((acc, p) => acc + p.amountCents, 0);
  });

  // Todas las cuotas pendientes enriquecidas con el nombre de la persona
  allPendingInstallments = computed(() => {
    const persons = this.persons();
    return this.installments()
      .filter(i => i.amountPaidCents < i.amountCents)
      .map(i => {
        const person = persons.find(p => p.id === i.personId);
        return {
          ...i,
          personName: person ? person.name : 'Desconocido'
        };
      });
  });

  // Historial global de pagos enriquecido con el nombre de la persona
  globalPaymentHistory = computed(() => {
    const persons = this.persons();
    return this.payments().map(p => {
      const person = persons.find(pers => pers.id === p.personId);
      return {
        ...p,
        personName: person ? person.name : 'Desconocido'
      };
    });
  });

  // Tasa de recuperación (Porcentaje de deuda pagada)
  recoveryRate = computed(() => {
    const totalInstallments = this.installments().reduce((acc, i) => acc + i.amountCents, 0);
    if (totalInstallments === 0) return 0;
    return Math.round((this.totalRecovered() / totalInstallments) * 100);
  });

  // Salud de la deuda: SANA, EN RIESGO, CRÍTICA
  debtHealth = computed((): 'SANA' | 'EN RIESGO' | 'CRÍTICA' => {
    const alerts = this.pendingAlerts();
    const overdue = alerts.find(a => a.type === 'OVERDUE');
    const critical = alerts.find(a => a.type === 'CRITICAL');

    if (overdue && overdue.installments.length > 5) return 'CRÍTICA';
    if (overdue || (critical && critical.installments.length > 2)) return 'EN RIESGO';
    return 'SANA';
  });

  // Mapa de deuda por persona: { personId: saldo }
  debtByPerson = computed(() => {
    const balances: Record<string, number> = {};

    this.installments().forEach(i => {
      balances[i.personId] = (balances[i.personId] || 0) + i.amountCents;
    });

    this.payments().forEach(p => {
      balances[p.personId] = (balances[p.personId] || 0) - p.amountCents;
    });

    return balances;
  });

  // --- Report Signals ---

  /** Group installments by month-year for trend chart */
  readonly monthlyInstallments = computed(() => {
    const byMonth = new Map<string, { totalCents: number; paidCents: number; count: number }>();

    for (const inst of this.installments()) {
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

  /** Total paid per person */
  readonly paidByPerson = computed(() => {
    const byPerson = new Map<string, number>();
    for (const p of this.payments()) {
      byPerson.set(p.personId, (byPerson.get(p.personId) || 0) + p.amountCents);
    }
    return byPerson;
  });

  /** Persons enriched with both owed and paid amounts */
  readonly personsWithPaid = computed(() => {
    const paid = this.paidByPerson();
    const debt = this.debtByPerson();
    return this.persons().map(p => ({
      ...p,
      owedCents: Math.max(0, debt[p.id] || 0),
      paidCents: paid.get(p.id) || 0,
    }));
  });

  // Lista de personas enriquecida con su saldo
  personsWithBalance = computed(() => {
    const balances = this.debtByPerson();
    return this.persons().map(p => ({
      ...p,
      balance: balances[p.id] || 0
    }));
  });

  // Sistema de alertas de vencimiento
  pendingAlerts = computed((): DebtAlert[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allPending = this.installments().filter(i => i.amountPaidCents < i.amountCents);
    
    const criticalItems: Installment[] = [];
    const warningItems: Installment[] = [];
    const overdueItems: Installment[] = [];

    allPending.forEach(i => {
      const due = new Date(i.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) criticalItems.push(i);
      else if (diffDays > 0 && diffDays <= 3) warningItems.push(i);
      else if (diffDays < 0) overdueItems.push(i);
    });

    const alerts: DebtAlert[] = [];
    if (overdueItems.length > 0) alerts.push({ type: 'OVERDUE', installments: overdueItems, message: 'Tienes pagos vencidos' });
    if (criticalItems.length > 0) alerts.push({ type: 'CRITICAL', installments: criticalItems, message: 'Pagos vencen HOY' });
    if (warningItems.length > 0) alerts.push({ type: 'WARNING', installments: warningItems, message: 'Pagos próximos a vencer' });

    return alerts;
  });

  // --- State Updates (Bulk — for initial load only) ---

  setPersons(persons: Person[]) {
    this.persons.set(persons);
  }

  setPurchases(purchases: Purchase[]) {
    this.purchases.set(purchases);
  }

  setInstallments(installments: Installment[]) {
    this.installments.set(installments);
  }

  setPayments(payments: Payment[]) {
    this.payments.set(payments);
  }

  // --- Direct Mutations (no re-read from DB needed) ---

  addPerson(person: Person) {
    this.persons.update(prev => [...prev, person]);
  }

  removePerson(id: string) {
    this.persons.update(prev => prev.filter(p => p.id !== id));
  }

  addPurchase(purchase: Purchase) {
    this.purchases.update(prev => [...prev, purchase]);
  }

  addInstallments(installments: Installment[]) {
    if (installments.length === 0) return;
    this.installments.update(prev => [...prev, ...installments]);
  }

  removePurchasesByPersonId(personId: string) {
    this.purchases.update(prev => prev.filter(p => p.personId !== personId));
  }

  removeInstallmentsByPersonId(personId: string) {
    this.installments.update(prev => prev.filter(i => i.personId !== personId));
  }

  updateInstallment(installment: Installment) {
    this.installments.update(prev => prev.map(i => i.id === installment.id ? installment : i));
  }

  addPayment(payment: Payment) {
    this.payments.update(prev => [...prev, payment]);
  }

  checkVencimientos() {
    const alerts = this.pendingAlerts();
    
    alerts.forEach(alert => {
      if (alert.type === 'CRITICAL') {
        this.notify.show(`🚨 ${alert.message}: ¡Evita intereses pagando hoy!`, 'warning', 5000);
      } else if (alert.type === 'OVERDUE') {
        this.notify.error(`⚠️ ${alert.message}: Tienes cuotas pendientes de pago.`);
      } else if (alert.type === 'WARNING') {
        this.notify.info(`📅 ${alert.message}: Organiza tu dinero para los próximos días.`);
      }
    });
  }
}
