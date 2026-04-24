import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DebtStateService } from '../../core/debt-state.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <h1>Mis Deudas</h1>
        <div class="total-balance-card">
          <span class="label">Saldo Total Global</span>
          <span class="amount">{{ formatCurrency(state.totalDebt()) }}</span>
        </div>
      </header>

      <main class="persons-list">
        <section class="section-title">
          <h2>Cuentas por cobrar</h2>
        </section>

        <div class="list-grid">
          @for (person of state.personsWithBalance(); track person.id) {
            <div class="person-card">
              <div class="person-info">
                <span class="person-name">{{ person.name }}</span>
                <span class="person-balance">{{ formatCurrency(person.balance) }}</span>
              </div>
              <button class="detail-btn" [attr.onclick]="'goToDetails(\"' + person.id + '\")'">
                Ver detalle
              </button>
            </div>
          } @empty {
            <div class="empty-state">
              <p>No hay personas registradas. Empieza agregando a alguien.</p>
            </div>
          }
        </div>
      </main>

      <footer class="fab-container">
        <button class="fab-add-person" (click)="addPerson()">
          <span>+</span>
          <span class="fab-label">Persona</span>
        </button>
      </footer>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 1rem;
      max-width: 500px;
      margin: 0 auto;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f8f9fa;
      min-height: 100vh;
      padding-bottom: 80px;
    }

    .dashboard-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .dashboard-header h1 {
      font-size: 1.5rem;
      color: #333;
      margin-bottom: 1rem;
    }

    .total-balance-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 1.5rem;
      box-shadow: 0 10px 20px rgba(118, 75, 162, 0.3);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .total-balance-card .label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }

    .total-balance-card .amount {
      font-size: 2.5rem;
      font-weight: bold;
    }

    .section-title h2 {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 1rem;
      padding-left: 0.5rem;
    }

    .list-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .person-card {
      background: white;
      padding: 1.2rem;
      border-radius: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: transform 0.2s;
    }

    .person-card:active {
      transform: scale(0.98);
    }

    .person-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .person-name {
      font-weight: 600;
      font-size: 1.1rem;
      color: #222;
    }

    .person-balance {
      font-size: 1rem;
      color: #666;
    }

    .detail-btn {
      background: #eee;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      cursor: pointer;
      color: #555;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #999;
      font-style: italic;
    }

    .fab-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
    }

    .fab-add-person {
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: #764ba2;
      color: white;
      border: none;
      box-shadow: 0 5px 15px rgba(118, 75, 162, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      position: relative;
    }

    .fab-label {
      position: absolute;
      right: 70px;
      background: #333;
      color: white;
      padding: 0.3rem 0.6rem;
      border-radius: 0.4rem;
      font-size: 0.7rem;
      white-space: nowrap;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
    }

    .fab-add-person:hover .fab-label {
      opacity: 1;
    }
  `]
})
export class DashboardComponent {
  public state = inject(DebtStateService);

  formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cents / 100);
  }

  goToDetails(personId: string) {
    console.log('Navegando al detalle de la persona:', personId);
    // Implementaremos routing más adelante
  }

  addPerson() {
    console.log('Abriendo modal de nueva persona');
    // Implementaremos el flujo de creación
  }
}
