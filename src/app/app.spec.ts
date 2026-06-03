import { Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { DebtService } from './core/services/debt.service';
import { App } from './app';
import { describe, it, expect, vi } from 'vitest';

describe('App', () => {
  const setupComponent = () => {
    const mockRouter = {} as Router;
    const mockDebtService = {
      loadInitialData: vi.fn().mockResolvedValue(undefined),
    } as unknown as DebtService;

    const injector = Injector.create({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: DebtService, useValue: mockDebtService },
      ],
    });

    const component = runInInjectionContext(injector, () => new App());
    return { component, mockDebtService };
  };

  it('should create the app', () => {
    const { component } = setupComponent();
    expect(component).toBeTruthy();
  });

  it('should load initial data on init', async () => {
    const { component, mockDebtService } = setupComponent();
    await component.ngOnInit();
    expect(mockDebtService.loadInitialData).toHaveBeenCalledTimes(1);
  });

  it('should have a title signal with value "web-app"', () => {
    const { component } = setupComponent();
    expect((component as unknown as { title: () => string }).title()).toBe('web-app');
  });
});