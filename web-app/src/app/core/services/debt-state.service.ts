import { Injectable, signal, computed } from '@angular/core';
import { LocalDbService } from './local-db.service';
import { Person, Purchase, Installment, Payment } from '../models/debt.model';

@Injectable({
  providedIn: 'root'
})
export class DebtStateService {
  // --- Writables (Sources of Truth) ---
  persons = signal<Person[]>([]);
  purchases = signal<Purchase[]>([]);
  installments = signal<Installment[]>([]);
  payments = signal<Payment[]>([]);

  constructor(private db: LocalDbService) {}

  // --- Computed (Reactive Derivations) ---

  // Total global que se debe actualmente
  totalDebt = computed(() => {
    const totalInstallments = this.installments().reduce((acc, i) => acc + i.amountCents, 0);
    const totalPayments = this.payments().reduce((acc, p) => acc + p.amountCents, 0);
    return totalInstallments - totalPayments;
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
}
