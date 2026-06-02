import { Injectable, signal, computed } from '@angular/core';

export interface AppSettings {
  currency: string;
  defaultClosingDay: number;
  defaultDueDay: number;
}

const STORAGE_KEY = 'deboapp-settings';
const DEFAULT_SETTINGS: AppSettings = {
  currency: 'ARS',
  defaultClosingDay: 15,
  defaultDueDay: 5,
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly settings = signal<AppSettings>(this.load());

  readonly currency = computed(() => this.settings().currency);
  readonly defaultClosingDay = computed(() => this.settings().defaultClosingDay);
  readonly defaultDueDay = computed(() => this.settings().defaultDueDay);

  private load(): AppSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private persist(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    this.settings.set(settings);
  }

  updateCurrency(currency: string): void {
    this.persist({ ...this.settings(), currency });
  }

  updateDefaultClosingDay(day: number): void {
    this.persist({ ...this.settings(), defaultClosingDay: Math.max(1, Math.min(31, day)) });
  }

  updateDefaultDueDay(day: number): void {
    this.persist({ ...this.settings(), defaultDueDay: Math.max(1, Math.min(31, day)) });
  }

  resetDefaults(): void {
    this.persist({ ...DEFAULT_SETTINGS });
  }
}
