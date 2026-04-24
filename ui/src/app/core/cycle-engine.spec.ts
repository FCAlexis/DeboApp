import { describe, it, expect } from 'vitest';
import { CycleEngine } from './cycle-engine';

describe('CycleEngine - Motor de Ciclos de Facturación', () => {
  
  describe('calculateClosingDate', () => {
    it('debe asignar el cierre al mes actual si la compra es antes del día de cierre', () => {
      const purchaseDate = new Date(2024, 0, 10); // 10 Ene 2024
      const closingDay = 15;
      const result = CycleEngine.calculateClosingDate(purchaseDate, closingDay);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // Enero
      expect(result.getDate()).toBe(15);
    });

    it('debe asignar el cierre al mes siguiente si la compra es después del día de cierre', () => {
      const purchaseDate = new Date(2024, 0, 20); // 20 Ene 2024
      const closingDay = 15;
      const result = CycleEngine.calculateClosingDate(purchaseDate, closingDay);
      
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // Febrero
      expect(result.getDate()).toBe(15);
    });

    it('debe manejar el clamping al día último del mes si el día de cierre es 31 y el mes tiene 30 días', () => {
      const purchaseDate = new Date(2024, 3, 10); // 10 Abril 2024
      const closingDay = 31;
      const result = CycleEngine.calculateClosingDate(purchaseDate, closingDay);
      
      // Abril tiene 30 días. El día 31 debe ajustarse al 30 de Abril.
      expect(result.getMonth()).toBe(3); // Abril
      expect(result.getDate()).toBe(30);
    });

    it('debe manejar el cambio de año correctamente', () => {
      const purchaseDate = new Date(2024, 11, 20); // 20 Dic 2024
      const closingDay = 15;
      const result = CycleEngine.calculateClosingDate(purchaseDate, closingDay);
      
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // Enero 2025
      expect(result.getDate()).toBe(15);
    });
  });

  describe('calculateDueDate', () => {
    it('debe calcular la fecha de vencimiento en el mes siguiente al cierre', () => {
      const closingDate = new Date(2024, 0, 15); // 15 Ene 2024
      const dueDay = 5;
      const result = CycleEngine.calculateDueDate(closingDate, dueDay);
      
      expect(result.getMonth()).toBe(1); // Febrero
      expect(result.getDate()).toBe(5);
    });

    it('debe saltar al siguiente mes si el día de vencimiento ya pasó en el mes del cierre', () => {
      const closingDate = new Date(2024, 0, 15); // 15 Ene 2024
      const dueDay = 10; // El 10 ya pasó respecto al 15
      const result = CycleEngine.calculateDueDate(closingDate, dueDay);
      
      expect(result.getMonth()).toBe(1); // Febrero
      expect(result.getDate()).toBe(10);
    });
  });

  describe('generateDates', () => {
    it('debe generar la secuencia correcta de cuotas manteniendo el día de vencimiento', () => {
      const firstDueDate = new Date(2024, 1, 5); // 5 Feb 2024
      const count = 3;
      const dueDay = 5;
      const dates = CycleEngine.generateDates(firstDueDate, count, dueDay);
      
      expect(dates).toHaveLength(3);
      expect(dates[0].getDate()).toBe(5);
      expect(dates[0].getMonth()).toBe(1); // Feb
      expect(dates[1].getDate()).toBe(5);
      expect(dates[1].getMonth()).toBe(2); // Mar
      expect(dates[2].getDate()).toBe(5);
      expect(dates[2].getMonth()).toBe(3); // Abr
    });

    it('debe aplicar clamping a todas las cuotas que caigan en días inexistentes (ej. día 31)', () => {
      const firstDueDate = new Date(2024, 0, 31); // 31 Ene
      const count = 2;
      const dueDay = 31;
      const dates = CycleEngine.generateDates(firstDueDate, count, dueDay);
      
      // Feb 2024 es bisiesto (29 días)
      expect(dates[1].getMonth()).toBe(1); // Febrero
      expect(dates[1].getDate()).toBe(29); 
    });
  });
});
