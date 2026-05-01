import { Injectable } from '@angular/core';
import { LocalDbService } from './local-db.service';
import { DebtStateService } from './debt-state.service';
import { Person, Purchase, Installment, Payment } from '../models/debt.model';
import { PaymentEngine } from '../payment-engine';
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

    this.state.updatePersons(persons);
    this.state.updatePurchases(purchases);
    this.state.updateInstallments(installments);
    this.state.updatePayments(payments);
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
    
    // Actualizar estado reactivo
    const currentPersons = await this.db.getAll<Person>('persons');
    this.state.updatePersons(currentPersons);
  }

  /**
   * Elimina una persona y sus registros asociados.
   */
  async deletePerson(id: string): Promise<void> {
    await this.db.delete('persons', id);
    
    // Limpiar compras y cuotas asociadas para evitar huérfanos
    const purchases = await this.db.getAll<Purchase>('purchases');
    const personPurchases = purchases.filter(p => p.personId === id);
    
    for (const p of personPurchases) {
      await this.db.delete('purchases', p.id);
      const installments = await this.db.getAll<Installment>('installments');
      const pInstallments = installments.filter(i => i.purchaseId === p.id);
      for (const inst of pInstallments) {
        await this.db.delete('installments', inst.id);
      }
    }

    const currentPersons = await this.db.getAll<Person>('persons');
    this.state.updatePersons(currentPersons);
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

    // 1. Obtener configuración de la tarjeta de la persona
    const persons = await this.db.getAll<Person>('persons');
    const person = persons.find(p => p.id === personId);
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

    // 4. Persistencia Atómica (en la medida de lo posible en IndexedDB)
    await this.db.put('purchases', purchase);
    for (const inst of installments) {
      await this.db.put('installments', inst);
    }

    // 5. Actualizar Estado Reactivo
    const currentPurchases = await this.db.getAll<Purchase>('purchases');
    const currentInstallments = await this.db.getAll<Installment>('installments');
    
    this.state.updatePurchases(currentPurchases);
    this.state.updateInstallments(currentInstallments);
  }

  /**
   * Registra un pago y distribuye el monto usando el PaymentEngine.
   * Ahora actualiza físicamente cada cuota afectada en la base de datos.
   */
  async registerPayment(personId: string, amountCents: number): Promise<void> {
    const paymentId = crypto.randomUUID();
    const payment: Payment = {
      id: paymentId,
      personId,
      amountCents,
      paymentDate: new Date()
    };

    // 1. Obtener cuotas actuales para el motor
    const allInstallments = await this.db.getAll<Installment>('installments');
    
    // Adaptar datos al formato que requiere el PaymentEngine (DebtItem)
    // IMPORTANTE: Ahora incluimos el monto ya pagado para que el motor sepa cuánto falta
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

    // 4. Persistir la distribución (Actualizar cada cuota afectada)
    for (const allocation of result.allocations) {
      const installment = allInstallments.find(i => i.id === allocation.debtItemId);
      if (installment) {
        installment.amountPaidCents = (installment.amountPaidCents || 0) + allocation.amountCents;
        await this.db.put('installments', installment);
      }
    }

    // 5. Actualizar Estado Reactivo (Sincronizar Signals)
    const currentPayments = await this.db.getAll<Payment>('payments');
    const currentInstallments = await this.db.getAll<Installment>('installments');
    
    this.state.updatePayments(currentPayments);
    this.state.updateInstallments(currentInstallments);
  }

}
