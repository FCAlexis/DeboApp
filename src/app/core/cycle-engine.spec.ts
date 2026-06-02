import { CycleEngine } from './cycle-engine';

describe('CycleEngine', () => {
  describe('calculateClosingDate', () => {
    it('should return same month closing when purchase date is before closing day', () => {
      const purchase = new Date(2026, 4, 10); // May 10, 2026
      const closing = CycleEngine.calculateClosingDate(purchase, 15);

      expect(closing.getFullYear()).toBe(2026);
      expect(closing.getMonth()).toBe(4); // May
      expect(closing.getDate()).toBe(15);
      expect(closing.getHours()).toBe(0);
    });

    it('should return next month closing when purchase date is after closing day', () => {
      const purchase = new Date(2026, 4, 20); // May 20, 2026
      const closing = CycleEngine.calculateClosingDate(purchase, 15);

      expect(closing.getFullYear()).toBe(2026);
      expect(closing.getMonth()).toBe(5); // June
      expect(closing.getDate()).toBe(15);
    });

    it('should clamp day 31 for months with 30 days', () => {
      // Purchase on Jan 31, closing day 31 — Feb has at most 29 days
      const purchase = new Date(2026, 0, 31); // Jan 31
      const closing = CycleEngine.calculateClosingDate(purchase, 31);

      // Because Jan 31 > closingDay(31) is FALSE (equal), same month.
      // So closing is Jan 31 → wait, it's purchase date's date (31) vs closingDay (31).
      // 31 > 31 is false, so targetMonth stays 0 (January).
      // closing is Jan 31.
      // Actually, let me reconsider. date.getDate() is 31, closingDay is 31, so 31 > 31 is false.
      // targetMonth = 0 (Jan).
      // result = new Date(2026, 0, 31) = Jan 31, 2026. That's valid.
      // But what about if purchase is Jan 31 and closingDay is 31?
      // 31 > 31 is false → same month, Jan 31.
      expect(closing.getFullYear()).toBe(2026);
      expect(closing.getMonth()).toBe(0); // January
      expect(closing.getDate()).toBe(31);
    });

    it('should clamp day 31 for months with fewer days (Feb)', () => {
      // Purchase on Jan 31 → closing day 30 (same month, valid Jan 30)...
      // Let's get closing for a purchase in January with closingDay 31:
      // Purchase Jan 15, closing day 31 → same month, Jan 31 (valid).
      // Better test: Purchase on Jan 31, closingDay 31 → same month, Jan 31.
      // Good. For the clamp case in Feb:
      // Purchase Jan 31 → closing adjusts. Since 31 > 31 is false, same month.
      // Actually let me do: Purchase Jan 31, closingDay 31.
      // Still same month because date(31) is not greater than closingDay(31).
      // So we get Jan 31. That works.
      // 
      // The real clamping test: Purchase Jan 31, closingDay 31.
      // 31 > 31 → false, so stays Jan. new Date(2026, 0, 31) = Jan 31. OK.
      // 
      // BETTER TEST: Purchase Jan 31, next month closing day 31.
      // But that needs date > closing day first. If Jan 31 and closingDay 30:
      // 31 > 30 → next month. new Date(2026, 1, 31) → Mar 3 (Feb has 28 days in 2026).
      // getMonth would be 2 (Mar), not 1 (Feb). So clamping: return Feb 28.
      const purchase = new Date(2026, 0, 31);
      const closing = CycleEngine.calculateClosingDate(purchase, 30);

      // 31 > 30 → next month (Feb). Feb 2026 has 28 days. Day 30 clamped → Feb 28.
      expect(closing.getFullYear()).toBe(2026);
      expect(closing.getMonth()).toBe(1); // February
      expect(closing.getDate()).toBe(28);
    });

    it('should handle December to January year boundary', () => {
      const purchase = new Date(2026, 11, 20); // Dec 20, 2026
      const closing = CycleEngine.calculateClosingDate(purchase, 5);

      // 20 > 5 → next month = Jan 2027
      expect(closing.getFullYear()).toBe(2027);
      expect(closing.getMonth()).toBe(0); // January
      expect(closing.getDate()).toBe(5);
    });
  });

  describe('calculateDueDate', () => {
    it('should return due date in same month when due day is after closing date', () => {
      const closing = new Date(2026, 4, 15); // May 15
      const due = CycleEngine.calculateDueDate(closing, 20);

      // 20 > 15 → same month (May 20)
      expect(due.getFullYear()).toBe(2026);
      expect(due.getMonth()).toBe(4); // May
      expect(due.getDate()).toBe(20);
    });

    it('should return due date in next month when due day is on or before closing date', () => {
      const closing = new Date(2026, 4, 15); // May 15
      const due = CycleEngine.calculateDueDate(closing, 10);

      // 10 <= 15 → next month (June 10)
      expect(due.getFullYear()).toBe(2026);
      expect(due.getMonth()).toBe(5); // June
      expect(due.getDate()).toBe(10);
    });
  });

  describe('generateDates', () => {
    it('should generate N installment dates starting from first due date', () => {
      const firstDue = new Date(2026, 4, 15); // May 15
      const dates = CycleEngine.generateDates(firstDue, 3, 15);

      expect(dates).toHaveLength(3);
      expect(dates[0].getMonth()).toBe(4); // May
      expect(dates[0].getDate()).toBe(15);
      expect(dates[1].getMonth()).toBe(5); // June
      expect(dates[1].getDate()).toBe(15);
      expect(dates[2].getMonth()).toBe(6); // July
      expect(dates[2].getDate()).toBe(15);
    });

    it('should handle year boundary crossing', () => {
      const firstDue = new Date(2026, 10, 15); // Nov 15
      const dates = CycleEngine.generateDates(firstDue, 4, 15);

      expect(dates).toHaveLength(4);
      expect(dates[0].getMonth()).toBe(10); // Nov 2026
      expect(dates[0].getFullYear()).toBe(2026);
      expect(dates[2].getMonth()).toBe(0); // Jan 2027
      expect(dates[2].getFullYear()).toBe(2027);
      expect(dates[3].getMonth()).toBe(1); // Feb 2027
      expect(dates[3].getFullYear()).toBe(2027);
    });

    it('should clamp day 31 for months with fewer days', () => {
      const firstDue = new Date(2026, 0, 31); // Jan 31
      const dates = CycleEngine.generateDates(firstDue, 2, 31);

      // Feb 31 → clamped to Feb 28
      expect(dates).toHaveLength(2);
      expect(dates[0].getMonth()).toBe(0); // Jan 31
      expect(dates[0].getDate()).toBe(31);
      expect(dates[1].getMonth()).toBe(1); // Feb
      expect(dates[1].getDate()).toBe(28);
    });
  });
});
