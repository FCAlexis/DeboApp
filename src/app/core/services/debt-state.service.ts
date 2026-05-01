import { Injectable, signal, computed } from '@angular/core';
import { LocalDbService } from './local-db.service';
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
    private db: LocalDbService,
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

    // Sumar cuotas
    this.installments().forEach(i => {
      balances[i.personId] = (balances[i.personId] || 0) + i.amountCents;
    });

    // Restar pagos
    this.payments().forEach(p => {
      balances[p.personId] = (balances[p.personId] || 0) - p.amountCents;
    });

    return balances;
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

  // --- State Updates ---
  
  async updatePersons(persons: Person[]) {
    this.persons.set(persons);
  }

  async updatePurchases(purchases: Purchase[]) {
    this.purchases.set(purchases);
  }

  async updateInstallments(installments: Installment[]) {
    this.installments.set(installments);
  }

  async updatePayments(payments: Payment[]) {
    this.payments.set(payments);
  }

  /**
   * Escanea los vencimientos actuales y dispara notificaciones.
   * Debe llamarse al iniciar la sesión o cargar datos.
   */
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
