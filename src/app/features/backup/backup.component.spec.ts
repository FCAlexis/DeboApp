import { Injector, runInInjectionContext, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LocalDbService, DbBackup } from '../../core/services/local-db.service';
import { DebtStateService } from '../../core/services/debt-state.service';
import { NotificationService } from '../../core/services/notification.service';
import { BackupComponent } from './backup.component';

function createMockState() {
  return {};
}

describe('BackupComponent', () => {
  const setupComponent = () => {
    const mockRouter = { navigate: vi.fn() };
    const mockNotify = { show: vi.fn(), error: vi.fn(), info: vi.fn() };
    const mockDbService = {
      exportData: vi.fn(),
      importData: vi.fn(),
    };
    const mockState = createMockState();

    const injector = Injector.create({
      providers: [
        { provide: LocalDbService, useValue: mockDbService },
        { provide: DebtStateService, useValue: mockState as any },
        { provide: Router, useValue: mockRouter },
        { provide: NotificationService, useValue: mockNotify },
      ],
    });

    const component = runInInjectionContext(injector, () => new BackupComponent());
    return { component, mockRouter, mockNotify, mockDbService };
  };

  it('should create the component', () => {
    const { component } = setupComponent();
    expect(component).toBeTruthy();
  });

  it('should start with no pending backup', () => {
    const { component } = setupComponent();
    expect(component.pendingBackup()).toBeNull();
    expect(component.fileName()).toBe('');
  });

  it('should navigate to dashboard on goBack', () => {
    const { component, mockRouter } = setupComponent();
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should cancelImport clear pendingBackup and fileName', () => {
    const { component } = setupComponent();
    (component as any).pendingBackup.set({ persons: [] } as any);
    (component as any).fileName.set('test.json');
    component.cancelImport();
    expect(component.pendingBackup()).toBeNull();
    expect(component.fileName()).toBe('');
  });

  it('should exportBackup call dbService.exportData', async () => {
    const { component, mockDbService } = setupComponent();
    mockDbService.exportData.mockResolvedValue({ persons: [], purchases: [], installments: [], payments: [] });
    // Mock URL.createObjectURL and the anchor click
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:url');
    const originalRevokeObjectURL = URL.revokeObjectURL;
    URL.revokeObjectURL = vi.fn();

    await component.exportBackup();

    expect(mockDbService.exportData).toHaveBeenCalled();
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('should exportBackup show error notification on failure', async () => {
    const { component, mockDbService, mockNotify } = setupComponent();
    mockDbService.exportData.mockRejectedValue(new Error('DB error'));

    await component.exportBackup();

    expect(mockNotify.error).toHaveBeenCalledWith('Error al exportar datos');
  });

  it('should onFileSelected set pendingBackup for valid JSON', () => {
    const { component } = setupComponent();
    const validBackup = { persons: [], purchases: [], installments: [], payments: [] };
    const blob = new Blob([JSON.stringify(validBackup)], { type: 'application/json' });
    const file = new File([blob], 'backup.json', { type: 'application/json' });

    component.onFileSelected({ target: { files: [file] } });

    // Give the FileReader async callback time
    // Since FileReader uses onload callback, we need to wait
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(component.fileName()).toBe('backup.json');
        expect(component.pendingBackup()).toEqual(validBackup);
        resolve();
      }, 100);
    });
  });

  it('should confirmImport import data and navigate', async () => {
    const { component, mockDbService, mockRouter, mockNotify } = setupComponent();
    const backup: DbBackup = { persons: [], purchases: [], installments: [], payments: [] };
    mockDbService.importData.mockResolvedValue(undefined);
    (component as any).pendingBackup.set(backup);
    (component as any).fileName.set('backup.json');

    await component.confirmImport();

    expect(mockDbService.importData).toHaveBeenCalledWith(backup);
    expect(mockNotify.show).toHaveBeenCalledWith('Datos importados con éxito');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.pendingBackup()).toBeNull();
  });
});
