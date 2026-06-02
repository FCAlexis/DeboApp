import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DebtService } from '../../core/services/debt.service';
import { DebtStateService } from '../../core/services/debt-state.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Gestionar Personas</h1>
        <div class="header-placeholder"></div>
      </header>

      <main class="layout">
        <section class="form-card">
          <h2 class="form-title">Nuevo Contacto</h2>
          <form (submit)="savePerson()" #personForm="ngForm">
            <div class="field">
              <label class="field-label">Nombre Completo</label>
              <input 
                name="name" 
                [(ngModel)]="newPerson.name" 
                #nameModel="ngModel" 
                required 
                placeholder="Ej. Juan Pérez"
                class="input">
            </div>

            <div class="row">
              <div class="field">
                <label class="field-label">Día de Cierre</label>
                <input 
                  type="number" 
                  name="closingDay" 
                  [(ngModel)]="newPerson.closingDay" 
                  #closingModel="ngModel" 
                  min="1" max="31" 
                  required 
                  class="input">
              </div>
              <div class="field">
                <label class="field-label">Día de Vencimiento</label>
                <input 
                  type="number" 
                  name="dueDay" 
                  [(ngModel)]="newPerson.dueDay" 
                  #dueModel="ngModel" 
                  min="1" max="31" 
                  required 
                  class="input">
              </div>
            </div>

            <button type="submit" [disabled]="!personForm.form.valid" class="btn-primary">
              <i class="bi bi-person-plus"></i> Guardar Contacto
            </button>
          </form>
        </section>

        <section class="list-section">
          <h3 class="list-title">Contactos Registrados</h3>
          <div class="grid">
            @for (person of state.persons(); track person.id) {
              <div class="contact-card">
                <div class="contact-avatar">
                  {{ person.name.charAt(0).toUpperCase() }}
                </div>
                <div class="contact-info">
                  <strong class="contact-name">{{ person.name }}</strong>
                  <span class="contact-detail">Corte: {{ person.closingDay }} | Pago: {{ person.dueDay }}</span>
                </div>
                <button class="delete-btn" (click)="deletePerson(person.id)" title="Eliminar">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            } @empty {
              <div class="empty">
                <span class="empty-icon">📋</span>
                <p>No hay contactos registrados aún.</p>
              </div>
            }
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .screen {
      min-height: 100vh;
      background: var(--bg-light);
      font-family: 'Inter', sans-serif;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.5rem;
      background: white;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .back-btn {
      background: white;
      border: 1px solid var(--border-color);
      color: var(--primary-color);
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 1.2rem;
    }

    .back-btn:hover {
      background: var(--bg-light);
      border-color: var(--primary-color);
    }

    .title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .header-placeholder {
      width: 40px;
    }

    .layout {
      padding: 1.5rem 1rem;
      max-width: 1100px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      align-items: start;
    }

    .form-card {
      background: white;
      padding: 2rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 1rem;
    }

    .form-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0 0 1.5rem 0;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .field-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 1rem;
      outline: none;
      transition: all 0.2s;
      background: var(--bg-light);
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
    }

    .input:focus {
      border-color: var(--primary-color);
      background: white;
      box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .btn-primary {
      width: 100%;
      min-width: 0;
      padding: 0.9rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
      transform: translateY(-1px);
      box-shadow: var(--shadow-sm);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .list-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0 0 1.25rem 0;
    }

    .grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-width: 0;
    }

    .contact-card {
      background: white;
      padding: 1rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 1px solid var(--border-color);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: default;
    }

    .contact-card:hover {
      border-color: var(--primary-color);
      transform: translateX(4px);
      box-shadow: var(--shadow-sm);
    }

    .contact-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
      font-size: 1.1rem;
    }

    .contact-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .contact-name {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-main);
    }

    .contact-detail {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .delete-btn {
      background: #fff5f5;
      color: var(--danger-color);
      border: 1px solid #ffe3e3;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .delete-btn:hover {
      background: var(--danger-color);
      color: white;
      border-color: var(--danger-color);
    }

    .empty {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 0.75rem;
      opacity: 0.4;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .form-card {
        padding: 1rem;
      }
      .list-section {
        padding: 1rem;
      }
      .input {
        padding: 0.5rem 0.75rem;
      }
      .row {
        grid-template-columns: 1fr;
      }
      .delete-btn {
        min-width: 44px;
        min-height: 44px;
      }
      .back-btn {
        min-width: 44px;
        min-height: 44px;
      }
    }
  `]
})
export class PersonsComponent {
  private debtService = inject(DebtService);
  private settings = inject(SettingsService);
  public state = inject(DebtStateService);
  private router = inject(Router);

  public newPerson = {
    name: '',
    closingDay: this.settings.defaultClosingDay(),
    dueDay: this.settings.defaultDueDay()
  };

  async savePerson() {
    try {
      await this.debtService.addPersonExtended(this.newPerson.name, this.newPerson.closingDay, this.newPerson.dueDay);
      this.newPerson = { name: '', closingDay: this.settings.defaultClosingDay(), dueDay: this.settings.defaultDueDay() };
    } catch (e) {
      console.error('Error guardando persona:', e);
    }
  }

  async deletePerson(id: string) {
    try {
      await this.debtService.deletePerson(id);
    } catch (e) {
      console.error('Error eliminando persona:', e);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
