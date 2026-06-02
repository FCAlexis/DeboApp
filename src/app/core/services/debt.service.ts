import { Injectable } from '@angular/core';
import { LocalDbService } from './local-db.service';
import { DebtStateService } from './debt-state.service';
import { Person, Purchase, Installment, Payment } from '../models/debt.model';
import { PaymentEngine, PaymentResult } from '../payment-engine';
import { CycleEngine } from '../cycle-engine';

@Injectable({
  providedIn: 'root'
})
export class DebtService {
  constructor(
    private db: LocalDbService,
    private state: DebtStateService
  ) {}

  /**
   * Carga todos los datos desde IndexedDB hacia las Signals al iniciar la app.
   */
  async loadInitialData(): Promise<void> {
    const [persons, purchases, installments, payments] = await Promise.all([
      this.db.getAll<Person>('persons'),
      this.db.getAll<Purchase>('purchases'),
      this.db.getAll<Installment>('installments'),
      this.db.getAll<Payment>('payments'),
    ]);

    this.state.setPersons(persons);
    this.state.setPurchases(purchases);
    this.state.setInstallments(installments);
    this.state.setPayments(payments);
  }

  /**
   * Registra una nueva persona con configuración de ciclos.
   */
  async addPersonExtended(name: string, closingDay: number, dueDay: number): Promise<void> {
    const person: Person = {
      id: crypto.randomUUID(),
      name: name,
      closingDay: closingDay,
      dueDay: dueDay
    };

    await this.db.put('persons', person);
    this.state.addPerson(person);
  }

  /**
   * Elimina una persona y sus registros asociados.
   */
  async deletePerson(id: string): Promise<void> {
    // Obtener datos asociados desde el estado (sin golpear la DB)
    const personPurchases = this.state.purchases().filter(p => p.personId === id);
    const purchaseIds = new Set(personPurchases.map(p => p.id));
    const personInstallments = this.state.installments().filter(
      i => i.personId === id || purchaseIds.has(i.purchaseId)
    );

    // Borrado Atómico (todo en una sola transacción)
    await this.db.runTransaction(['persons', 'purchases', 'installments'], 'readwrite', tx => {
      tx.objectStore('persons').delete(id);
      for (const p of personPurchases) {
        tx.objectStore('purchases').delete(p.id);
      }
      for (const inst of personInstallments) {
        tx.objectStore('installments').delete(inst.id);
      }
    });

    // Actualizar estado reactivo sin releer la DB
    this.state.removePerson(id);
    this.state.removePurchasesByPersonId(id);
    this.state.removeInstallmentsByPersonId(id);
  }

  /**
   * Registra una nueva persona (Versión simplificada).
   */
  async addPerson(name: string): Promise<void> {
    await this.addPersonExtended(name, 15, 5);
  }

  /**
   * Registra una compra y genera automáticamente sus cuotas.
   */
  async addPurchase(personId: string, description: string, totalCents: number, installmentCount: number): Promise<void> {
    // --- Validaciones ---
    if (totalCents <= 0) throw new Error('El monto total debe ser mayor a cero');
    if (installmentCount <= 0) throw new Error('La cantidad de cuotas debe ser mayor a cero');

    const person = this.state.persons().find(p => p.id === personId);
    if (!person) throw new Error('La persona no existe');

    const purchaseId = crypto.randomUUID();
    const purchase: Purchase = {
      id: purchaseId,
      personId,
      description,
      totalCents,
      installmentCount,
      createdAt: new Date()
    };

    // Generar fechas de vencimiento usando el motor de ciclos
    const closingDate = CycleEngine.calculateClosingDate(purchase.createdAt, person.closingDay);
    const firstDueDate = CycleEngine.calculateDueDate(closingDate, person.dueDay);
    const dueDates = CycleEngine.generateDates(firstDueDate, installmentCount, person.dueDay);

    // Generar cuotas
    const installments: Installment[] = [];
    const amountPerInstallment = Math.floor(totalCents / installmentCount);
    const remainder = totalCents % installmentCount;

    for (let i = 0; i < installmentCount; i++) {
      installments.push({
        id: crypto.randomUUID(),
        purchaseId,
        personId,
        number: i + 1,
        amountCents: i === 0 ? amountPerInstallment + remainder : amountPerInstallment,
        amountPaidCents: 0,
        dueDate: dueDates[i]
      });
    }

    // Persistencia Atómica (todo en una sola transacción)
    await this.db.runTransaction(['purchases', 'installments'], 'readwrite', tx => {
      tx.objectStore('purchases').put(purchase);
      for (const inst of installments) {
        tx.objectStore('installments').put(inst);
      }
    });

    // Actualizar Estado Reactivo (sin releer la DB)
    this.state.addPurchase(purchase);
    this.state.addInstallments(installments);
  }

  /**
   * Registra un pago y distribuye el monto usando el PaymentEngine.
   * @returns El resultado de la distribución (allocations, remaining, etc.)
   */
  async registerPayment(personId: string, amountCents: number): Promise<PaymentResult> {
    const paymentId = crypto.randomUUID();
    const payment: Payment = {
      id: paymentId,
      personId,
      amountCents,
      paymentDate: new Date()
    };

    // 1. Obtener cuotas desde el estado (sin golpear la DB)
    const allInstallments = this.state.installments();
    
    const debtItems = allInstallments
      .filter(i => i.personId === personId)
      .map(i => ({
        id: i.id,
        tipo: 'CUOTA' as const,
        personaId: i.personId,
        fechaVencimiento: i.dueDate,
        createdAt: new Date(), 
        montoTotalCentavos: i.amountCents,
        montoPagadoCentavos: i.amountPaidCents || 0 
      }));

    // 2. Ejecutar Motor de Distribución
    const result = PaymentEngine.distribuirPago(personId, amountCents, debtItems);

    // 3. Persistencia Atómica (pago + cuotas afectadas en una sola transacción)
    await this.db.runTransaction(['payments', 'installments'], 'readwrite', tx => {
      tx.objectStore('payments').put(payment);
      for (const allocation of result.allocations) {
        const installment = allInstallments.find(i => i.id === allocation.debtItemId);
        if (installment) {
          installment.amountPaidCents = (installment.amountPaidCents || 0) + allocation.amountCents;
          tx.objectStore('installments').put(installment);
        }
      }
    });

    // 4. Actualizar Estado Reactivo
    this.state.addPayment(payment);
    for (const allocation of result.allocations) {
      const installment = allInstallments.find(i => i.id === allocation.debtItemId);
      if (installment) {
        this.state.updateInstallment(installment);
      }
    }

    return result;
  }

}
