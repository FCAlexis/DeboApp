import { Injector, runInInjectionContext, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';
import { SettingsComponent } from './settings.component';
import { vi } from 'vitest';

describe('SettingsComponent', () => {
  const setupComponent = () => {
    const mockRouter = { navigate: vi.fn() };

    const currency = signal('ARS');
    const defaultClosingDay = signal(15);
    const defaultDueDay = signal(5);

    const mockSettings = {
      currency: currency.asReadonly(),
      defaultClosingDay: defaultClosingDay.asReadonly(),
      defaultDueDay: defaultDueDay.asReadonly(),
      updateCurrency: vi.fn((c: string) => currency.set(c)),
      updateDefaultClosingDay: vi.fn((d: number) => defaultClosingDay.set(d)),
      updateDefaultDueDay: vi.fn((d: number) => defaultDueDay.set(d)),
      resetDefaults: vi.fn(() => {
        currency.set('ARS');
        defaultClosingDay.set(15);
        defaultDueDay.set(5);
      }),
    };

    const injector = Injector.create({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: SettingsService, useValue: mockSettings },
      ],
    });

    const component = runInInjectionContext(injector, () => new SettingsComponent());
    return { component, mockRouter, mockSettings };
  };

  it('should create the component', () => {
    const { component } = setupComponent();
    expect(component).toBeTruthy();
  });

  describe('currency', () => {
    it('should have default currency ARS', () => {
      const { component } = setupComponent();
      expect(component['settings'].currency()).toBe('ARS');
    });

    it('should update currency via onCurrencyChange', () => {
      const { component, mockSettings } = setupComponent();
      component.onCurrencyChange({ target: { value: 'USD' } } as unknown as Event);
      expect(mockSettings.updateCurrency).toHaveBeenCalledWith('USD');
    });

    it('should update currency signal when service updates', () => {
      const { component } = setupComponent();
      component['settings'].updateCurrency('EUR');
      expect(component['settings'].currency()).toBe('EUR');
    });
  });

  describe('default closing day', () => {
    it('should have default closing day 15', () => {
      const { component } = setupComponent();
      expect(component['settings'].defaultClosingDay()).toBe(15);
    });

    it('should update closing day via onClosingDayChange', () => {
      const { component, mockSettings } = setupComponent();
      component.onClosingDayChange({ target: { value: '20' } } as unknown as Event);
      expect(mockSettings.updateDefaultClosingDay).toHaveBeenCalledWith(20);
    });
  });

  describe('default due day', () => {
    it('should have default due day 5', () => {
      const { component } = setupComponent();
      expect(component['settings'].defaultDueDay()).toBe(5);
    });

    it('should update due day via onDueDayChange', () => {
      const { component, mockSettings } = setupComponent();
      component.onDueDayChange({ target: { value: '10' } } as unknown as Event);
      expect(mockSettings.updateDefaultDueDay).toHaveBeenCalledWith(10);
    });
  });

  describe('resetDefaults', () => {
    it('should call resetDefaults on the service', () => {
      const { component, mockSettings } = setupComponent();
      component['settings'].updateCurrency('USD');
      expect(component['settings'].currency()).toBe('USD');

      component.resetDefaults();
      expect(mockSettings.resetDefaults).toHaveBeenCalled();
      expect(component['settings'].currency()).toBe('ARS');
      expect(component['settings'].defaultClosingDay()).toBe(15);
      expect(component['settings'].defaultDueDay()).toBe(5);
    });
  });

  describe('deleteAllData', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should call confirm and clear localStorage on confirm', () => {
      const { component } = setupComponent();
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      const clearSpy = vi.spyOn(Storage.prototype, 'clear');

      // window.location.reload is read-only in jsdom; we test confirm + clear
      expect(() => component.deleteAllData()).not.toThrow();

      expect(confirmSpy).toHaveBeenCalled();
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should NOT clear data if confirm is cancelled', () => {
      const { component } = setupComponent();
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const clearSpy = vi.spyOn(Storage.prototype, 'clear');

      component.deleteAllData();

      expect(clearSpy).not.toHaveBeenCalled();
    });
  });

  describe('goBack', () => {
    it('should navigate to dashboard', () => {
      const { component, mockRouter } = setupComponent();
      component.goBack();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('appVersion', () => {
    it('should have a version string', () => {
      const { component } = setupComponent();
      expect(component['appVersion']).toBe('0.0.0');
    });
  });
});
