import { Injectable } from '@angular/core';

export interface DbConfig {
  name: string;
  version: number;
  stores: string[];
}

export interface DbBackup {
  version: number;
  timestamp: string;
  data: {
    [storeName: string]: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class LocalDbService {
  private dbName = 'DeboAppDB';
  private dbVersion = 1;
  private storeNames = ['persons', 'purchases', 'installments', 'payments'];
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;

    // SSR Guard: indexedDB only exists in the browser
    if (typeof indexedDB === 'undefined') {
      console.warn('LocalDbService: indexedDB not available in this environment (SSR). Skipping init.');
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event: any) => {
        const db = request.result;
        this.storeNames.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(storeName: string, item: any): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAll(): Promise<void> {
    const db = await this.init();
    const transaction = db!.transaction(this.storeNames, 'readwrite');
    this.storeNames.forEach(storeName => {
      transaction.objectStore(storeName).clear();
    });
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Exporta toda la base de datos a un formato JSON laL de Backup.
   */
  async exportData(): Promise<DbBackup> {
    const backupData: { [key: string]: any[] } = {};
    
    for (const storeName of this.storeNames) {
      backupData[storeName] = await this.getAll(storeName);
    }

    return {
      version: this.dbVersion,
      timestamp: new Date().toISOString(),
      data: backupData
    };
  }

  /**
   * Importa datos desde un objeto de Backup.
   * Primero limpia la DB para evitar duplicados o inconsistencias.
   */
  async importData(backup: DbBackup): Promise<void> {
    if (backup.version !== this.dbVersion) {
      throw new Error('La versión del backup no es compatible con la versión actual de la app.');
    }

    await this.clearAll();

    const db = await this.init();
    const stores = Object.keys(backup.data);
    for (const storeName of stores) {
      if (this.storeNames.includes(storeName)) {
        const items = backup.data[storeName];
        await new Promise<void>((resolve, reject) => {
          const transaction = db!.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          items.forEach(item => store.put(item));
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      }
    }
  }
}
