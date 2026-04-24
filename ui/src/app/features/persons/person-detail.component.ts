import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { DebtStateService, Person, Purchase, Installment } from '../../core/debt-state.service';
import { DebtService } from '../../core/debt.service';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-container">
      <header class="header">
        <button class="back-btn" (click)="goBack()">← Volver</button>
        <h1 class="person-title">{{ person()?.name }}</h1>
      </header>

      @if (person()) {
        <main class="content">
          <section class="balance-card">
            <div class="balance-info">
              <span class="label">Saldo Pendiente</span>
              <span class="amount">{{ formatCurrency(personBalance()) }}</span>
            </div>
            <button class="add-purchase-btn" (click)="addNewPurchase()">
              + Nueva Compra
            </button>
          </section>

          <section class="installments-section">
            <h2 class="section-title">Cuotas Pendientes</h2>
            <div class="installments-grid">
              @for (inst of personInstallments(); track inst.id) {
                <div class="installment-item">
                  <div class="inst-info">
                    <span class="inst-date">{{ formatDate(inst.dueDate) }}</span>
                    <span class="inst-desc">Cuota {{ inst.number }}</span>
                  </div>
                  <div class="inst-amount">
                    {{ formatCurrency(inst.amountCents) }}
                  </div>
                </div>
              } @empty {
                <p class="empty-text">No hay cuotas pendientes para esta persona.</p>
              }
            </div>
          </section>

          <section class="purchases-section">
            <h2 class="section-title">Historial de Compras</h2>
            <div class="purchases-list">
              @for (pur of personPurchases(); track pur.id) {
                <div class="purchase-item">
                  <div class="pur-info">
                    <strong class="pur-name">{{ pur.description }}</strong>
                    <span class="pur-meta">{{ pur.installmentCount }} cuotas • {{ formatDate(pur.createdAt) }}</span>
                  </div>
                  <span class="pur-amount">{{ formatCurrency(pur.totalCents) }}</span>
                </div>
              }
            </div>
          </section>
        </main>
      } @else {
        <div class="error-state">Persona no encontrada</div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
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

    .person-title {
      font-size: clamp(1.5rem, 5vw, 2.5rem);
      color: #333;
      margin: 0;
    }

    .balance-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .balance-info {
      display: flex;
      flex-direction: column;
    }

    .balance-info .label {
      font-size: 0.9rem;
      color: #666;
    }

    .balance-info .amount {
      font-size: 1.8rem;
      font-weight: bold;
      color: #764ba2;
    }

    .add-purchase-btn {
      background: #764ba2;
      color: white;
      border: none;
      padding: 0.8rem 1.2rem;
      border-radius: 0.8rem;
      font-weight: bold;
      cursor: pointer;
    }

    .section-title {
      font-size: 1.1rem;
      color: #666;
      margin: 1.5rem 0 1rem 0;
    }

    .installments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .installment-item {
      background: white;
      padding: 1rem;
      border-radius: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
      border-left: 4px solid #764ba2;
    }

    .inst-info {
      display: flex;
      flex-direction: column;
    }

    .inst-date {
      font-weight: 600;
      color: #333;
    }

    .inst-desc {
      font-size: 0.85rem;
      color: #888;
    }

    .inst-amount {
      font-weight: bold;
      color: #444;
    }

    .purchases-list {
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .purchase-item {
      background: white;
      padding: 1rem;
      border-radius: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.03);
    }

    .pur-info {
      display: flex;
      flex-direction: column;
    }

    .pur-name {
      color: #222;
    }

    .pur-meta {
      font-size: 0.8rem;
      color: #888;
    }

    .pur-amount {
      font-weight: 600;
      color: #666;
    }

    .empty-text {
      text-align: center;
      color: #999;
      grid-column: 1 / -1;
    }

    .error-state {
      text-align: center;
      padding: 3rem;
      color: red;
    }
  `]
})
export class PersonDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public state = inject(DebtStateService);

  // State derived from URL
  public person = signal<Person | null>(null);
  public personBalance = signal<number>(0);
  public personPurchases = signal<Purchase[]>([]);
  public personInstallments = signal<Installment[]>([]);

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPersonData(id);
    }
  }

  loadPersonData(id: string) {
    const p = this.state.persons().find(p => p.id === id);
    if (p) {
      this.person.set(p);
      
      // Get balance from computed
      const balances = this.state.debtByPerson();
      this.personBalance.set(balances[id] || 0);

      // Filter purchases and installments
      this.personPurchases.set(this.state.purchases().filter(pur => pur.personId === id));
      this.personInstallments.set(
        this.state.installments()
          .filter(inst => inst.personId === id)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      );
    }
  }

  formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cents / 100);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  addNewPurchase() {
    // Pasar el ID de la persona a la ruta de compras
    const id = this.person()?.id;
    this.router.navigate(['/purchase'], { queryParams: { personId: id } });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
