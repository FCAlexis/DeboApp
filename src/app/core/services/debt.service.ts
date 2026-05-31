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

    // Borrar de la DB
    await this.db.delete('persons', id);
    for (const p of personPurchases) {
      await this.db.delete('purchases', p.id);
    }
    for (const inst of personInstallments) {
      await this.db.delete('installments', inst.id);
    }

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
    const purchaseId = crypto.randomUUID();
    const purchase: Purchase = {
      id: purchaseId,
      personId,
      description,
      totalCents,
      installmentCount,
      createdAt: new Date()
    };

    // 1. Obtener configuración de la tarjeta de la persona (desde el estado)
    const person = this.state.persons().find(p => p.id === personId);
    if (!person) throw new Error("La persona no existe");

    // 2. Generar fechas de vencimiento usando el motor de ciclos
    const closingDate = CycleEngine.calculateClosingDate(purchase.createdAt, person.closingDay);
    const firstDueDate = CycleEngine.calculateDueDate(closingDate, person.dueDay);
    const dueDates = CycleEngine.generateDates(firstDueDate, installmentCount, person.dueDay);

    // 3. Generar cuotas
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

    // 4. Persistencia en DB
    await this.db.put('purchases', purchase);
    for (const inst of installments) {
      await this.db.put('installments', inst);
    }

    // 5. Actualizar Estado Reactivo (sin releer la DB)
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

    // 3. Persistir el Pago Global
    await this.db.put('payments', payment);
    this.state.addPayment(payment);

    // 4. Persistir y actualizar cada cuota afectada
    for (const allocation of result.allocations) {
      const installment = allInstallments.find(i => i.id === allocation.debtItemId);
      if (installment) {
        installment.amountPaidCents = (installment.amountPaidCents || 0) + allocation.amountCents;
        await this.db.put('installments', installment);
        this.state.updateInstallment(installment);
      }
    }

    return result;
  }

}
