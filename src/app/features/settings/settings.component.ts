import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Ajustes</h1>
        <div class="header-placeholder"></div>
      </header>

      <main class="layout">
        <!-- Currency -->
        <section class="card">
          <div class="card-header">
            <div class="icon-box"><i class="bi bi-currency-exchange"></i></div>
            <h2>Moneda</h2>
            <p>Seleccioná la moneda con la que trabajás</p>
          </div>
          <div class="field">
            <label class="field-label" for="currency">Moneda predeterminada</label>
            <select
              id="currency"
              class="input select"
              [value]="settings.currency()"
              (change)="onCurrencyChange($event)"
            >
              <option value="ARS">ARS — Peso argentino</option>
              <option value="USD">USD — Dólar estadounidense</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </section>

        <!-- Default closing day -->
        <section class="card">
          <div class="card-header">
            <div class="icon-box"><i class="bi bi-calendar-range"></i></div>
            <h2>Día de cierre</h2>
            <p>Día del mes en que cierra el período</p>
          </div>
          <div class="field">
            <label class="field-label" for="closingDay">
              Día de cierre: <strong>{{ settings.defaultClosingDay() }}</strong>
            </label>
            <input
              id="closingDay"
              class="input range"
              type="range"
              min="1"
              max="31"
              [value]="settings.defaultClosingDay()"
              (input)="onClosingDayChange($event)"
            />
            <div class="range-labels">
              <span>1</span>
              <span>31</span>
            </div>
          </div>
        </section>

        <!-- Default due day -->
        <section class="card">
          <div class="card-header">
            <div class="icon-box"><i class="bi bi-calendar-check"></i></div>
            <h2>Día de vencimiento</h2>
            <p>Día del mes en que vencen las cuotas</p>
          </div>
          <div class="field">
            <label class="field-label" for="dueDay">
              Día de vencimiento: <strong>{{ settings.defaultDueDay() }}</strong>
            </label>
            <input
              id="dueDay"
              class="input range"
              type="range"
              min="1"
              max="31"
              [value]="settings.defaultDueDay()"
              (input)="onDueDayChange($event)"
            />
            <div class="range-labels">
              <span>1</span>
              <span>31</span>
            </div>
          </div>
        </section>

        <!-- Reset defaults -->
        <section class="card">
          <div class="card-header">
            <div class="icon-box"><i class="bi bi-arrow-counterclockwise"></i></div>
            <h2>Restablecer valores</h2>
            <p>Volvé a los valores predeterminados (ARS, cierre 15, vencimiento 5)</p>
          </div>
          <button class="btn btn-secondary" (click)="resetDefaults()">
            <i class="bi bi-arrow-counterclockwise"></i> Restablecer
          </button>
        </section>

        <!-- Delete all data -->
        <section class="card danger">
          <div class="card-header">
            <div class="icon-box danger"><i class="bi bi-trash"></i></div>
            <h2>Eliminar todos los datos</h2>
            <p>Esta acción no se puede deshacer. Borra todo el almacenamiento local.</p>
          </div>
          <button class="btn btn-danger" (click)="deleteAllData()">
            <i class="bi bi-trash"></i> Eliminar todo
          </button>
        </section>

        <!-- Export / Import -->
        <section class="card">
          <div class="card-header">
            <div class="icon-box"><i class="bi bi-cloud-arrow-up"></i></div>
            <h2>Exportar / Importar</h2>
            <p>Administrá tus respaldos de datos</p>
          </div>
          <a class="btn btn-secondary" [routerLink]="['/backup']">
            <i class="bi bi-download"></i> Ir a respaldos
          </a>
        </section>

        <!-- About -->
        <section class="card about">
          <div class="card-header">
            <div class="icon-box"><i class="bi bi-info-circle"></i></div>
            <h2>Acerca de</h2>
          </div>
          <div class="about-info">
            <div class="about-row">
              <span class="about-label">Versión</span>
              <span class="about-value">{{ appVersion }}</span>
            </div>
            <div class="about-row">
              <span class="about-label">App</span>
              <span class="about-value">DeboApp</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .screen { min-height: 100vh; background: var(--bg-light); font-family: 'Inter', sans-serif; }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: white; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .back-btn { background: white; border: 1px solid var(--border-color); color: var(--primary-color); cursor: pointer; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .back-btn:hover { filter: brightness(0.9); transform: translateY(-1px); }
    .title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .header-placeholder { width: 40px; }
    .layout { padding: 2rem 1rem; max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; padding-bottom: 4rem; }

    .card { background: white; padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 1.25rem; }
    .card.danger { border-color: #ffe3e3; background: #fffafa; }
    .card.about { background: var(--bg-light); border-style: dashed; }

    .card-header { display: flex; flex-direction: column; gap: 0.5rem; }
    .card-header h2 { font-size: 1.15rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .card-header p { font-size: 0.85rem; color: var(--text-muted); margin: 0; line-height: 1.4; }

    .icon-box { width: 48px; height: 48px; background: #ede9fe; color: var(--primary-color); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
    .icon-box.danger { background: #ffe3e3; color: var(--danger-color); }

    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    .field-label { font-size: 0.9rem; font-weight: 500; color: var(--text-main); }
    .field-label strong { color: var(--primary-color); }

    .input { width: 100%; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.95rem; color: var(--text-main); background: white; transition: border-color 0.2s; }
    .input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1); }
    .select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23636e72' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; cursor: pointer; }
    .range { padding: 0; height: 6px; border: none; appearance: none; background: #e9ecef; border-radius: 3px; cursor: pointer; }
    .range::-webkit-slider-thumb { appearance: none; width: 20px; height: 20px; border-radius: 50%; background: var(--primary-color); cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
    .range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: var(--primary-color); cursor: pointer; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
    .range-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); }

    .btn { display: inline-flex; align-items: center; gap: 8px; padding: 0.7rem 1.25rem; border-radius: var(--radius-sm); font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none; text-decoration: none; width: fit-content; }
    .btn:hover { filter: brightness(0.9); transform: translateY(-1px); }
    .btn-secondary { background: white; border: 1px solid var(--border-color); color: var(--text-main); }
    .btn-danger { background: var(--danger-color); color: white; }

    .about-info { display: flex; flex-direction: column; gap: 0.75rem; }
    .about-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color); }
    .about-row:last-child { border-bottom: none; }
    .about-label { font-size: 0.9rem; color: var(--text-muted); }
    .about-value { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }

    @media (max-width: 600px) {
      .layout { padding: 1rem 0.75rem; }
      .card { padding: 1.25rem; }
    }
  `],
})
export class SettingsComponent {
  protected settings = inject(SettingsService);
  private router = inject(Router);

  protected appVersion = '0.0.0';

  constructor() {
    // Try to read version from package.json if available in the browser context
    try {
      if (typeof document !== 'undefined') {
        // In a real build, version could come from an environment variable or build-time injection
        // For now, use a hardcoded fallback that matches package.json
        this.appVersion = '0.0.0';
      }
    } catch {
      // ignore
    }
  }

  onCurrencyChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.settings.updateCurrency(value);
  }

  onClosingDayChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.settings.updateDefaultClosingDay(value);
  }

  onDueDayChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.settings.updateDefaultDueDay(value);
  }

  resetDefaults(): void {
    this.settings.resetDefaults();
  }

  deleteAllData(): void {
    const confirmed = window.confirm(
      '¿Estás seguro de que querés eliminar TODOS tus datos? Esta acción no se puede deshacer.'
    );
    if (confirmed) {
      localStorage.clear();
      window.location.reload();
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
