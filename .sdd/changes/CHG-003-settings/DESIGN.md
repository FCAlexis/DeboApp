# Design: Settings Page (CHG-003-settings)

## Technical Approach

New standalone `SettingsComponent`, signal-based `SettingsService` backed by `localStorage`, and a shared `formatCurrency` utility function extracted from 5 duplicate implementations. All changes are mechanical refactoring plus one new feature route — no new npm dependencies or DB schema changes.

## Architecture Decisions

| Decision | Options | Chosen | Rationale |
|----------|---------|--------|-----------|
| Persistence | **localStorage** vs IndexedDB vs in-memory | localStorage | Simple key-value. Settings are tiny (<1KB). No async needed. Matches existing backup's use of localStorage/adapter. |
| Currency reactivity | **SettingsService signal** vs event bus vs router param | SettingsService signal | Components already use signals. A writable signal in a root service means all consumers react automatically — no wiring. |
| formatCurrency signature | **Pure function** vs service method vs pipe | Pure function | No DI needed. Testable without Angular TestBed. Currency injected as parameter (read from service by callers). |
| Default days propagation | **SettingsService signal** vs input binding vs dynamic form | SettingsService signal | PersonsComponent already uses `inject()`. Reading `settings.defaultClosingDay()` as `signal()` means the form defaults update reactively. |
| Form approach | Reactive forms vs **template-driven** | Template-driven | Consistent with existing components (BackupComponent, etc.). Simple form — no complex validation. |

## Data Flow

```
localStorage
  └── key: "deboapp-settings"
       └── JSON: { currency, defaultClosingDay, defaultDueDay }
              │
              ▼
      SettingsService (providedIn: 'root')
      ├── currency = signal<'ARS'|'USD'|'EUR'>       ← persisted
      ├── defaultClosingDay = signal<number>           ← persisted
      ├── defaultDueDay = signal<number>                ← persisted
      ├── updateSetting(key, value) → signal.set() + localStorage.setItem()
      ├── resetDefaults() → restore + persist
      └── clearAllData() → LocalDbService.clearAll() + toast
              │
              ├──────────────────────────────────────┐
              ▼                                      ▼
      SettingsComponent                      5 Components (consumers)
      ├── reads all signals                    ├── dashboard
      ├── currency dropdown                    ├── payment
      ├── closing day input                    ├── person-detail
      ├── due day input                        ├── payments-list
      ├── delete all + confirmation            └── debts
      ├── export / import (→ BackupComponent)  └── PersonsComponent
      └── about section                             └── reads defaultClosingDay / defaultDueDay
                                                           │
                                                           ▼
                                                   formatCurrency(cents, currency)
                                                   ← pure function, no DI
```

## SettingsService

```typescript
// src/app/core/services/settings.service.ts
import { Injectable, signal } from '@angular/core';
import { NotificationService } from './notification.service';
import { LocalDbService } from './local-db.service';

export interface AppSettings {
  currency: 'ARS' | 'USD' | 'EUR';
  defaultClosingDay: number;
  defaultDueDay: number;
}

const STORAGE_KEY = 'deboapp-settings';
const DEFAULTS: AppSettings = {
  currency: 'ARS',
  defaultClosingDay: 15,
  defaultDueDay: 5,
};

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private notify = inject(NotificationService);
  private db = inject(LocalDbService);

  private state = loadSettings();

  currency = signal(this.state.currency);
  defaultClosingDay = signal(this.state.defaultClosingDay);
  defaultDueDay = signal(this.state.defaultDueDay);

  updateSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    (this as any)[key].set(value);
    this.persist();
  }

  resetDefaults(): void {
    this.currency.set(DEFAULTS.currency);
    this.defaultClosingDay.set(DEFAULTS.defaultClosingDay);
    this.defaultDueDay.set(DEFAULTS.defaultDueDay);
    this.persist();
  }

  async clearAllData(): Promise<void> {
    await this.db.clearAll();
    this.notify.show('Todos los datos han sido eliminados');
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      currency: this.currency(),
      defaultClosingDay: this.defaultClosingDay(),
      defaultDueDay: this.defaultDueDay(),
    }));
  }
}
```

## formatCurrency Utility

```typescript
// src/app/core/utils/format-currency.ts

export function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}
```

All 5 components and their tests update from `this.formatCurrency(cents)` to `formatCurrency(cents, currency)`. The currency value comes from `SettingsService.currency()` (injected where needed). Test files import the function directly (no TestBed required for formatting tests).

## SettingsComponent Structure

```
src/app/features/settings/
├── settings.component.ts       ← component logic (inject SettingsService, handlers)
├── settings.component.html     ← template (sections: currency, days, data, about)
├── settings.component.css      ← layout (responsive 320px+, card-based sections)
└── settings.component.spec.ts  ← tests
```

### Template sections

1. **Header**: Back button + title "Configuración"
2. **Currency**: Label + `<select>` with ARS/USD/EUR options — updates on change
3. **Default Days**: Two labeled number inputs (1-31, type="number", min=1 max=31) — clamp on blur
4. **Data Management**: "Exportar Datos" button (reuses `BackupComponent.exportBackup` logic) + "Importar Datos" file picker + "Eliminar Todos los Datos" danger button with confirmation modal
5. **About**: App name + version (read from `package.json` or hardcoded `0.0.0`)

### CSS approach

Same card-based pattern as BackupComponent: white cards with `border-radius`, `box-shadow`, `padding: 2rem`. Sections separated by dividers. Danger button in red. Responsive via `@media (max-width: 600px)` — cards go full-width, inputs stack vertically.

## Route

```typescript
{ path: 'settings', component: SettingsComponent }
```

Replace `PlaceholderComponent` with `SettingsComponent` in `app.routes.ts`.

## Updates to PersonsComponent

```typescript
// Before
public newPerson = { name: '', closingDay: 15, dueDay: 5 };

// After
private settings = inject(SettingsService);
public newPerson = {
  name: '',
  get closingDay() { return this.settings.defaultClosingDay(); },
  get dueDay() { return this.settings.defaultDueDay(); },
};
```

Reset after save also reads fresh defaults:
```typescript
this.newPerson = { name: '', closingDay: this.settings.defaultClosingDay(), dueDay: this.settings.defaultDueDay() };
```

## Key Test Scenarios

1. SettingsService loads defaults when localStorage is empty
2. SettingsService restores persisted values on init
3. `updateSetting` updates signal + localStorage
4. `resetDefaults` restores all values to ARS/15/5
5. `clearAllData` calls LocalDbService and shows toast
6. SettingsComponent renders all sections (currency, days, data, about)
7. Currency change in settings propagates to formatCurrency output
8. Default day change in settings updates new person form defaults
9. Responsive: no overflow at 320px width
10. Existing formatCurrency tests pass using the shared utility
