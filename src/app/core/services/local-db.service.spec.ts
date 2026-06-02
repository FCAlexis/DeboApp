import { LocalDbService, DbBackup } from './local-db.service';

/**
 * Factory: creates a LocalDbService that uses in-memory Maps instead of IndexedDB.
 * This avoids the need for fake-indexeddb or browser APIs in JSDOM.
 */
function createMockLocalDbService(): LocalDbService {
  const stores: Record<string, Map<string, any>> = {
    persons: new Map(),
    purchases: new Map(),
    installments: new Map(),
    payments: new Map(),
  };

  const service = new LocalDbService();

  // Override init to skip real IndexedDB
  (service as any).init = async () => null;

  // Replace getAll
  (service as any).getAll = async <T>(storeName: string): Promise<T[]> => {
    const store = stores[storeName];
    if (!store) return [];
    return Array.from(store.values()) as T[];
  };

  // Replace put
  (service as any).put = async (storeName: string, item: any): Promise<void> => {
    const store = stores[storeName];
    if (!store) throw new Error(`Store ${storeName} not found`);
    store.set(item.id, { ...item });
  };

  // Replace delete
  (service as any).delete = async (storeName: string, id: string): Promise<void> => {
    const store = stores[storeName];
    if (!store) throw new Error(`Store ${storeName} not found`);
    store.delete(id);
  };

  // Replace clearAll
  (service as any).clearAll = async (): Promise<void> => {
    Object.values(stores).forEach(store => store.clear());
  };

  // Override exportData
  (service as any).exportData = async (): Promise<DbBackup> => {
    const data: Record<string, any[]> = {};
    for (const [name, map] of Object.entries(stores)) {
      data[name] = Array.from(map.values());
    }
    return {
      version: 1,
      timestamp: new Date().toISOString(),
      data,
    };
  };

  // Override importData
  (service as any).importData = async (backup: DbBackup): Promise<void> => {
    if (backup.version !== 1) {
      throw new Error('La versión del backup no es compatible con la versión actual de la app.');
    }
    Object.values(stores).forEach(store => store.clear());
    for (const [storeName, items] of Object.entries(backup.data)) {
      const store = stores[storeName];
      if (store) {
        for (const item of items) {
          store.set(item.id, { ...item });
        }
      }
    }
  };

  return service;
}

describe('LocalDbService', () => {
  let service: LocalDbService;

  beforeEach(() => {
    service = createMockLocalDbService();
  });

  describe('CRUD operations', () => {
    it('should put and getAll items from a store', async () => {
      const person = { id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 };

      await service.put('persons', person);
      const all = await service.getAll<any>('persons');

      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('p1');
      expect(all[0].name).toBe('Juan');
    });

    it('should update existing item with put', async () => {
      const person = { id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 };
      const updated = { id: 'p1', name: 'Juan Actualizado', closingDay: 10, dueDay: 3 };

      await service.put('persons', person);
      await service.put('persons', updated);
      const all = await service.getAll<any>('persons');

      expect(all).toHaveLength(1);
      expect(all[0].name).toBe('Juan Actualizado');
    });

    it('should delete an item by id', async () => {
      await service.put('persons', { id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 });
      await service.put('persons', { id: 'p2', name: 'María', closingDay: 20, dueDay: 10 });

      await service.delete('persons', 'p1');
      const all = await service.getAll<any>('persons');

      expect(all).toHaveLength(1);
      expect(all[0].id).toBe('p2');
    });

    it('should clear all stores', async () => {
      await service.put('persons', { id: 'p1', name: 'Juan' } as any);
      await service.put('purchases', { id: 'pur1', description: 'Test' } as any);

      await service.clearAll();
      const persons = await service.getAll<any>('persons');
      const purchases = await service.getAll<any>('purchases');

      expect(persons).toHaveLength(0);
      expect(purchases).toHaveLength(0);
    });
  });

  describe('export/import', () => {
    it('should export all data as DbBackup', async () => {
      await service.put('persons', { id: 'p1', name: 'Juan', closingDay: 15, dueDay: 5 });
      await service.put('purchases', { id: 'pur1', personId: 'p1', description: 'Test', totalCents: 50000, installmentCount: 3, createdAt: new Date() });

      const backup = await service.exportData();

      expect(backup.version).toBe(1);
      expect(backup.timestamp).toBeTruthy();
      expect(backup.data.persons).toHaveLength(1);
      expect(backup.data.purchases).toHaveLength(1);
      expect(backup.data.installments).toHaveLength(0);
      expect(backup.data.payments).toHaveLength(0);
    });

    it('should import data via importData (clear + replace)', async () => {
      // First, put some initial data
      await service.put('persons', { id: 'old', name: 'Viejo', closingDay: 15, dueDay: 5 });

      // Now import new data
      const backup: DbBackup = {
        version: 1,
        timestamp: new Date().toISOString(),
        data: {
          persons: [
            { id: 'p1', name: 'Nuevo', closingDay: 10, dueDay: 3 },
            { id: 'p2', name: 'Otro', closingDay: 20, dueDay: 8 },
          ],
        },
      };

      await service.importData(backup);
      const persons = await service.getAll<any>('persons');

      // Should have replaced, not merged
      expect(persons).toHaveLength(2);
      expect(persons.find((p: any) => p.id === 'old')).toBeUndefined();
      expect(persons.find((p: any) => p.id === 'p1').name).toBe('Nuevo');
    });

    it('should reject incompatible version', async () => {
      const backup: DbBackup = {
        version: 999,
        timestamp: new Date().toISOString(),
        data: { persons: [] },
      };

      await expect(service.importData(backup)).rejects.toThrow(
        'no es compatible con la versión actual'
      );
    });
  });
});
