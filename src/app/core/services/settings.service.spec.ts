import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have default values', () => {
    const service = new SettingsService();
    expect(service.currency()).toBe('ARS');
    expect(service.defaultClosingDay()).toBe(15);
    expect(service.defaultDueDay()).toBe(5);
  });

  it('should update currency', () => {
    const service = new SettingsService();
    service.updateCurrency('USD');
    expect(service.currency()).toBe('USD');
  });

  it('should update defaultClosingDay', () => {
    const service = new SettingsService();
    service.updateDefaultClosingDay(20);
    expect(service.defaultClosingDay()).toBe(20);
  });

  it('should clamp defaultClosingDay to 1-31', () => {
    const service = new SettingsService();
    service.updateDefaultClosingDay(0);
    expect(service.defaultClosingDay()).toBe(1);
    service.updateDefaultClosingDay(32);
    expect(service.defaultClosingDay()).toBe(31);
  });

  it('should update defaultDueDay', () => {
    const service = new SettingsService();
    service.updateDefaultDueDay(10);
    expect(service.defaultDueDay()).toBe(10);
  });

  it('should clamp defaultDueDay to 1-31', () => {
    const service = new SettingsService();
    service.updateDefaultDueDay(0);
    expect(service.defaultDueDay()).toBe(1);
    service.updateDefaultDueDay(32);
    expect(service.defaultDueDay()).toBe(31);
  });

  it('should persist settings to localStorage', () => {
    const service = new SettingsService();
    service.updateCurrency('USD');

    const raw = localStorage.getItem('deboapp-settings');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.currency).toBe('USD');
  });

  it('should restore persisted settings on load', () => {
    const service1 = new SettingsService();
    service1.updateCurrency('USD');
    service1.updateDefaultClosingDay(20);
    service1.updateDefaultDueDay(10);

    // Create a new instance — should read from localStorage
    const service2 = new SettingsService();
    expect(service2.currency()).toBe('USD');
    expect(service2.defaultClosingDay()).toBe(20);
    expect(service2.defaultDueDay()).toBe(10);
  });

  it('should reset to defaults', () => {
    const service = new SettingsService();
    service.updateCurrency('USD');
    service.updateDefaultClosingDay(20);
    service.resetDefaults();

    expect(service.currency()).toBe('ARS');
    expect(service.defaultClosingDay()).toBe(15);
    expect(service.defaultDueDay()).toBe(5);
  });
});
