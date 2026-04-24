import { describe, it, expect } from 'vitest';
import { CycleEngine } from './cycle-engine';

describe('CycleEngine', () => {
  describe('calculateClosingDate', () => {
    it('should set closing date to current month if purchase is before closing day', () => {
      const purchaseDate = new Date(2026, 3, 10); // April 10, 2026
      const closingDay = 15;
      const result = CycleEngine.calculateClosingDate(purchaseDate, closingDay);
      
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(15);
    });

    it('should set closing date to next month if purchase is after closing day', () => {
      const purchaseDate = new Date(2026, 3, 16); // April 16, 2026
      const closingDay = 15;
      const result = CycleEngine.calculateClosingDate(purchaseDate, closingDay);
      
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(4); // May
      expect(result.getDate()).toBe(15);
    });

    it('should set closing date to current month if purchase is on closing day', () => {
      const purchaseDate = new Date(2026, 3, 15); // April 15, 2026
      const closingDay = 15;
      const result = CycleEngine.calculateClosingDate(purchaseDate, closingDay);
      
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(15);
    });

    it('should clamp closing date to last day of month if closingDay is 31 and month has 30 days', () => {
      const purchaseDate = new Date(2026, 3, 10); // April 10, 2026 (April has 30 days)
      const closingDay = 31;
      const result = CycleEngine.calculateClosingDate(purchaseDate, closingDay);
      
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(30);
    });
  });

  describe('calculateDueDate', () => {
    it('should set due date to the month following closure if dueDay <= closingDate', () => {
      const closingDate = new Date(2026, 3, 15); // April 15, 2026
      const dueDay = 5;
      const result = CycleEngine.calculateDueDate(closingDate, dueDay);
      
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(4); // May
      expect(result.getDate()).toBe(5);
    });

    it('should set due date to the same month if dueDay > closingDate', () => {
      const closingDate = new Date(2026, 3, 15); // April 15, 2026
      const dueDay = 20;
      const result = CycleEngine.calculateDueDate(closingDate, dueDay);
      
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(20);
    });

    it('should clamp due date to last day of February in non-leap year', () => {
      const closingDate = new Date(2026, 0, 31); // Jan 31, 2026
      const dueDay = 31;
      const result = CycleEngine.calculateDueDate(closingDate, dueDay);
      
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(28);
    });
  });

  describe('generateDates', () => {
    it('should generate a sequence of due dates maintaining the same dueDay', () => {
      const firstDueDate = new Date(2026, 4, 5); // May 5, 2026
      const count = 3;
      const dueDay = 5;
      const results = CycleEngine.generateDates(firstDueDate, count, dueDay);
      
      expect(results).toHaveLength(3);
      expect(results[0].getDate()).toBe(5);
      expect(results[0].getMonth()).toBe(4); // May
      expect(results[1].getDate()).toBe(5);
      expect(results[1].getMonth()).toBe(5); // June
      expect(results[2].getDate()).toBe(5);
      expect(results[2].getMonth()).toBe(6); // July
    });

    it('should clamp subsequent due dates to the last day of the month', () => {
      const firstDueDate = new Date(2026, 0, 31); // Jan 31, 2026
      const count = 2;
      const dueDay = 31;
      const results = CycleEngine.generateDates(firstDueDate, count, dueDay);
      
      expect(results).toHaveLength(2);
      expect(results[0].getDate()).toBe(31);
      expect(results[0].getMonth()).toBe(0); // Jan
      expect(results[1].getDate()).toBe(28);
      expect(results[1].getMonth()).toBe(1); // Feb
    });
  });
});
