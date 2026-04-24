export type DebtTipo = 'AJUSTE' | 'CUOTA';

export interface DebtItem {
  id: string;
  tipo: DebtTipo;
  personaId: string;
  fechaVencimiento: Date | null;
  createdAt: Date;
  montoTotalCentavos: number;
  montoPagadoCentavos: number;
}

export interface PaymentAllocation {
  deudaId: string;
  montoCentavos: number;
}

export interface PaymentResult {
  aplicadoTotal: number;
  restante: number;
  allocations: PaymentAllocation[];
}

export class PaymentEngine {
  /**
   * Distribuye un monto de pago entre las deudas de una persona
   * siguiendo la prioridad: Vencidos -> Antigüedad -> Ajustes -> Creación -> ID
   */
  public static distribuirPago(personaId: string, montoPagoCentavos: number, deudas: DebtItem[]): PaymentResult {
    if (montoPagoCentavos <= 0) {
      throw new Error("El monto del pago debe ser mayor a cero");
    }

    const now = new Date();
    
    // 1. Filtrar solo deudas con saldo pendiente
    let pendientes = deudas.filter(d => d.montoTotalCentavos > d.montoPagadoCentavos);

    // 2. Ordenar según la prioridad sagrada
    pendientes.sort((a, b) => {
      // A. Vencidos primero
      const aVencido = a.fechaVencimiento && a.fechaVencimiento < now;
      const bVencido = b.fechaVencimiento && b.fechaVencimiento < now;
      if (aVencido !== bVencido) return aVencido ? -1 : 1;

      // B. Fecha de vencimiento más antigua primero
      if (a.fechaVencimiento && b.fechaVencimiento) {
        if (a.fechaVencimiento.getTime() !== b.fechaVencimiento.getTime()) {
          return a.fechaVencimiento.getTime() - b.fechaVencimiento.getTime();
        }
      } else if (a.fechaVencimiento) return -1;
      else if (b.fechaVencimiento) return 1;

      // C. Ajustes antes que Cuotas
      if (a.tipo !== b.tipo) {
        return a.tipo === 'AJUSTE' ? -1 : 1;
      }

      // D. Fecha de creación más antigua
      if (a.createdAt.getTime() !== b.createdAt.getTime()) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }

      // E. Desempate final por ID
      return a.id.localeCompare(b.id);
    });

    let restante = montoPagoCentavos;
    const allocations: PaymentAllocation[] = [];

    // 3. Distribución Greedy
    for (const deuda of pendientes) {
      if (restante <= 0) break;

      const saldo = deuda.montoTotalCentavos - deuda.montoPagadoCentavos;
      const aplicado = Math.min(restante, saldo);

      allocations.push({
        deudaId: deuda.id,
        montoCentavos: aplicado
      });

      restante -= aplicado;
    }

    return {
      aplicadoTotal: montoPagoCentavos - restante,
      restante: restante,
      allocations: allocations
    };
  }
}
