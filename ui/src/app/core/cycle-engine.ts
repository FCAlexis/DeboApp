export class CycleEngine {
  /**
   * Determina la fecha de cierre de una compra basándose en la fecha de la compra 
   * y el día de cierre configurado de la tarjeta.
   * 
   * @param purchaseDate Fecha en la que se realizó la compra
   * @param closingDay Día del mes en que cierra la tarjeta (1-31)
   * @returns Fecha de cierre normalizada a medianoche
   */
  public static calculateClosingDate(purchaseDate: Date, closingDay: number): Date {
    const date = new Date(purchaseDate);
    date.setHours(0, 0, 0, 0);

    let targetYear = date.getFullYear();
    let targetMonth = date.getMonth();

    if (date.getDate() > closingDay) {
      targetMonth++;
    }

    const result = new Date(targetYear, targetMonth, closingDay);
    
    // Clamping: if JS moved to the next month, it means closingDay > daysInMonth.
    // We return the last day of the intended targetMonth.
    if (result.getMonth() !== (targetMonth % 12 + 12) % 12) {
      return new Date(targetYear, targetMonth + 1, 0);
    }
    
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Calcula la fecha de vencimiento de la primera cuota basándose en la fecha de cierre
   * y el día de vencimiento configurado de la tarjeta.
   * 
   * @param closingDate Fecha de cierre calculada
   * @param dueDay Día del mes de vencimiento (1-31)
   * @returns Fecha de vencimiento normalizada a medianoche
   */
  public static calculateDueDate(closingDate: Date, dueDay: number): Date {
    const date = new Date(closingDate);
    date.setHours(0, 0, 0, 0);

    let targetMonth = date.getMonth();
    let targetYear = date.getFullYear();

    if (dueDay <= date.getDate()) {
      targetMonth++;
    }

    const result = new Date(targetYear, targetMonth, dueDay);
    
    if (result.getMonth() !== (targetMonth % 12 + 12) % 12) {
      return new Date(targetYear, targetMonth + 1, 0);
    }
    
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Genera una secuencia de fechas de vencimiento para N cuotas, manteniendo
   * el día de vencimiento configurado.
   * 
   * @param firstDueDate Fecha de vencimiento de la primera cuota
   * @param count Número total de cuotas
   * @param dueDay Día del mes de vencimiento (1-31)
   * @returns Array de fechas de vencimiento normalizadas
   */
  public static generateDates(firstDueDate: Date, count: number, dueDay: number): Date[] {
    const dates: Date[] = [];
    const startYear = firstDueDate.getFullYear();
    const startMonth = firstDueDate.getMonth();
    
    for (let i = 0; i < count; i++) {
      const targetMonth = startMonth + i;
      
      const result = new Date(startYear, targetMonth, dueDay);
      
      // The expected month is targetMonth % 12.
      // We use (targetMonth % 12 + 12) % 12 to handle negative months if ever used.
      const expectedMonth = (targetMonth % 12 + 12) % 12;
      
      if (result.getMonth() !== expectedMonth) {
        // Clamp to last day of intended month
        const clamped = new Date(startYear, targetMonth + 1, 0);
        clamped.setHours(0, 0, 0, 0);
        dates.push(clamped);
      } else {
        result.setHours(0, 0, 0, 0);
        dates.push(result);
      }
    }
    
    return dates;
  }
}
