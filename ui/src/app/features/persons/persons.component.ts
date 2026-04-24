import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DebtService } from '../../core/debt.service';
import { DebtStateService, Person } from '../../core/debt-state.service';

@Component({
  selector: 'app-persons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="persons-container">
      <header class="header">
        <button class="back-btn" (click)="goBack()">← Volver</button>
        <h1>Gestionar Personas</h1>
      </header>

      <main class="main-content">
        <section class="form-card">
          <h2>Nueva Persona</h2>
          <form (submit)="savePerson()" #personForm="ngForm">
            <div class="input-group">
              <label>Nombre Completo</label>
              <input 
                name="name" 
                [(ngModel)]="newPerson.name" 
                #nameModel="ngModel" 
                required 
                placeholder="Ej. Juan Pérez"
                class="form-input">
            </div>

            <div class="row">
              <div class="input-group">
                <label>Día de Cierre</label>
                <input 
                  type="number" 
                  name="closingDay" 
                  [(ngModel)]="newPerson.closingDay" 
                  #closingModel="ngModel" 
                  min="1" max="31" 
                  required 
                  class="form-input">
              </div>
              <div class="input-group">
                <label>Día de Vencimiento</label>
                <input 
                  type="number" 
                  name="dueDay" 
                  [(ngModel)]="newPerson.dueDay" 
                  #dueModel="ngModel" 
                  min="1" max="31" 
                  required 
                  class="form-input">
              </div>
            </div>

            <button type="submit" [disabled]="!personForm.form.valid" class="save-btn">
              Guardar Contacto
            </button>
          </form>
        </section>

        <section class="persons-list">
          <h3 class="section-title">Contactos Registrados</h3>
          <div class="grid">
            @for (person of state.persons(); track person.id) {
              <div class="person-item">
                <div class="info">
                  <strong class="person-name">{{ person.name }}</strong>
                  <span class="person-details">Cierre: {{ person.closingDay }} | Vence: {{ person.dueDay }}</span>
                </div>
                <button class="delete-btn" (click)="deletePerson(person.id)">🗑️</button>
              </div>
            } @empty {
              <p class="empty-text">No hay personas registradas.</p>
            }
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .persons-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .back-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 1rem;
    }

    .header h1 {
      font-size: clamp(1.5rem, 5vw, 2.5rem);
      color: #333;
      margin: 0;
    }

    .main-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2rem;
      align-items: start;
    }

    .form-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      position: sticky;
      top: 1rem;
    }

    .form-card h2 {
      font-size: 1.2rem;
      margin-top: 0;
      margin-bottom: 1.5rem;
      color: #444;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.2rem;
    }

    .input-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #666;
    }

    .form-input {
      padding: 0.8rem;
      border: 1px solid #ddd;
      border-radius: 0.8rem;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      border-color: #764ba2;
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .save-btn {
      width: 100%;
      padding: 1rem;
      background: #764ba2;
      color: white;
      border: none;
      border-radius: 0.8rem;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .persons-list h3 {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 1rem;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 0.8rem;
    }

    .person-item {
      background: white;
      padding: 1rem;
      border-radius: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }

    .info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .info strong {
      font-size: 1rem;
      color: #222;
    }

    .info span {
      font-size: 0.8rem;
      color: #888;
    }

    .delete-btn {
      background: #fff5f5;
      border: none;
      padding: 0.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-size: 1.2rem;
    }

    .empty-text {
      text-align: center;
      color: #999;
      font-style: italic;
      margin-top: 2rem;
      grid-column: 1 / -1;
    }
  `]
})
export class PersonsComponent {
  private debtService = inject(DebtService);
  public state = inject(DebtStateService);
  private router = inject(Router);

  // Model para el formulario
  public newPerson = {
    name: '',
    closingDay: 15,
    dueDay: 5
  };

  async savePerson() {
    try {
      await this.debtService.addPersonExtended(this.newPerson.name, this.newPerson.closingDay, this.newPerson.dueDay);
      this.newPerson = { name: '', closingDay: 15, dueDay: 5 };
    } catch (e) {
      console.error('Error guardando persona:', e);
    }
  }

  async deletePerson(id: string) {
    try {
      await this.debtService.deletePerson(id);
    } catch (e) {
      console.error('Houve un error eliminando persona:', e);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
