import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DebtStateService } from '../../core/services/debt-state.service';
import { Person, Purchase, Installment } from '../../core/models/debt.model';

export type InstallmentStatus = 'PAID' | 'OVERDUE' | 'COMING_SOON' | 'FUTURE';

@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="detail-screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Detalles del Contacto</h1>
        <div class="header-placeholder"></div>
      </header>

      @if (person()) {
        <main class="layout">
          <!-- Profile Hero Card -->
          <div class="profile-card">
            <div class="profile-main">
                <div class="profile-avatar">
                  {{ (person()?.name || 'U').charAt(0).toUpperCase() }}
                </div>
              <div class="profile-info">
                <h2 class="person-name">{{ person()?.name }}</h2>
                <div class="balance-badge">
                  <span class="label">Saldo Pendiente</span>
                  <span class="amount">{{ formatCurrency(personBalance()) }}</span>
                </div>
              </div>
            </div>
            <div class="profile-actions">
              <button class="action-btn secondary" (click)="addNewPurchase()">
                <i class="bi bi-cart-plus"></i>
                <span>Compra</span>
              </button>
              <button class="action-btn primary" (click)="goToPayment()">
                <i class="bi bi-cash-stack"></i>
                <span>Abonar</span>
              </button>
            </div>
          </div>

          <!-- Installments Timeline -->
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">Cuotas Pendientes</h2>
              <span class="count-badge">{{ personInstallments().length }}</span>
            </div>
            <div class="timeline">
              @for (inst of personInstallments(); track inst.id) {
                <div class="timeline-item" [class]="getStatusClass(inst)">
                  <div class="date-box">
                    <span class="month">{{ getMonthName(inst.dueDate) }}</span>
                    <span class="day">{{ inst.dueDate.getDate() }}</span>
                  </div>
                  <div class="item-content">
                    <div class="item-main">
                      <span class="inst-desc">Cuota {{ inst.number }}</span>
                      <span class="inst-amount">{{ formatCurrency(inst.amountCents - (inst.amountPaidCents || 0)) }}</span>
                    </div>
                    <div class="item-footer">
                      <span class="due-date">Vence: {{ formatDate(inst.dueDate) }}</span>
                      <span class="status-tag" [class]="getStatusClass(inst)">
                        {{ getStatusLabel(getStatus(inst)) }}
                      </span>
                    </div>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  <i class="bi bi-check-circle-fill"></i>
                  <p>No hay cuotas pendientes para esta persona.</p>
                </div>
              }
            </div>
          </section>

          <!-- Purchases History -->
          <section class="section">
            <div class="section-header">
              <h2 class="section-title">Historial de Compras</h2>
            </div>
            <div class="purchases-list">
              @for (pur of personPurchases(); track pur.id) {
                <div class="purchase-card">
                  <div class="pur-avatar">
                    <i class="bi bi-bag-check"></i>
                  </div>
                  <div class="pur-info">
                    <strong class="pur-name">{{ pur.description }}</strong>
                    <span class="pur-meta">{{ pur.installmentCount }} cuotas • {{ formatDate(pur.createdAt) }}</span>
                  </div>
                  <div class="pur-amount">
                    {{ formatCurrency(pur.totalCents) }}
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  <i class="bi bi-archive"></i>
                  <p>Aún no hay compras registradas.</p>
                </div>
              }
            </div>
          </section>
        </main>
      } @else {
        <div class="error-container">
          <i class="bi bi-exclamation-triangle"></i>
          <p>Persona no encontrada</p>
          <button class="btn-retry" (click)="goBack()">Volver al Inicio</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-screen {
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

    .header-placeholder { width: 40px; }

    .layout {
      padding: 1.5rem 1rem;
      max-width: 700px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .profile-card {
      background: white;
      padding: 2rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .profile-main {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .profile-avatar {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      font-weight: 700;
      box-shadow: var(--shadow-sm);
    }

    .profile-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .person-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .balance-badge {
      background: #ede9fe;
      padding: 0.4rem 0.8rem;
      border-radius: 99px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: fit-content;
    }

    .balance-badge .label {
      font-size: 0.75rem;
      color: var(--primary-color);
      font-weight: 600;
      text-transform: uppercase;
    }

    .balance-badge .amount {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--primary-color);
    }

    .profile-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .action-btn {
      padding: 0.8rem;
      border-radius: var(--radius-sm);
      border: none;
      cursor: pointer;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s;
    }

    .action-btn.primary {
      background: var(--primary-color);
      color: white;
    }

    .action-btn.secondary {
      background: white;
      border: 1px solid var(--border-color);
      color: var(--text-main);
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0;
    }

    .count-badge {
      background: var(--bg-card);
      color: var(--text-muted);
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 99px;
      border: 1px solid var(--border-color);
    }

    .timeline {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .timeline-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      padding: 1rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      transition: all 0.2s;
    }

    .timeline-item:hover {
      transform: translateX(4px);
    }

    .timeline-item.overdue { border-left: 4px solid var(--danger-color); }
    .timeline-item.coming-soon { border-left: 4px solid var(--warning-color); }
    .timeline-item.paid { border-left: 4px solid var(--success-color); opacity: 0.7; }
    .timeline-item.future { border-left: 4px solid var(--border-color); }

    .date-box {
      width: 48px;
      height: 48px;
      background: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .date-box .month {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .date-box .day {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .item-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .item-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .inst-desc {
      font-weight: 600;
      color: var(--text-main);
    }

    .inst-amount {
      font-weight: 700;
      color: var(--text-main);
    }

    .item-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .due-date {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .status-tag {
      font-size: 0.7rem;
      padding: 2px 8px;
      border-radius: 99px;
      font-weight: 600;
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-tag.overdue {
      background: #ffebee;
      color: var(--danger-color);
    }
    .status-tag.coming-soon {
      background: #fff3e0;
      color: var(--warning-color);
    }
    .status-tag.paid {
      background: #e8f5e9;
      color: var(--success-color);
    }
    .status-tag.future {
      background: #f5f5f5;
      color: var(--text-muted);
    }

    .purchases-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .purchase-card {
      background: white;
      padding: 1rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 1px solid var(--border-color);
      transition: all 0.2s;
    }

    .purchase-card:hover {
      border-color: var(--primary-color);
    }

    .pur-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--bg-light);
      color: var(--primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      flex-shrink: 0;
    }

    .pur-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .pur-name {
      font-weight: 600;
      color: var(--text-main);
      font-size: 0.95rem;
    }

    .pur-meta {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .pur-amount {
      font-weight: 700;
      color: var(--text-main);
      font-size: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .empty-state i {
      font-size: 2.5rem;
      opacity: 0.3;
    }

    .error-container {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .error-container i {
      font-size: 3rem;
      color: var(--danger-color);
    }

    .btn-retry {
      padding: 0.8rem 1.5rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-weight: 600;
    }
  `]
})
export class PersonDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  public state = inject(DebtStateService);

  // Única signal de entrada: el id desde la ruta
  public personId = signal<string | null>(null);

  // Todo lo demás se DERIVA reactivamente
  public person = computed(() => {
    const id = this.personId();
    return id ? this.state.persons().find(p => p.id === id) ?? null : null;
  });

  public personBalance = computed(() => {
    const id = this.personId();
    return id ? (this.state.debtByPerson()[id] || 0) : 0;
  });

  public personPurchases = computed(() => {
    const id = this.personId();
    return id ? this.state.purchases().filter(p => p.personId === id) : [];
  });

  public personInstallments = computed(() => {
    const id = this.personId();
    return id
      ? this.state.installments()
          .filter(inst => inst.personId === id)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
      : [];
  });

  constructor() {
    // Escuchamos cambios en la ruta reactivamente
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.personId.set(params.get('id'));
      });
  }

  formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(cents / 100);
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getMonthName(date: Date): string {
    return date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase().substring(0, 3);
  }

  getStatus(inst: Installment): InstallmentStatus {
    const paid = (inst.amountPaidCents || 0) >= inst.amountCents;
    if (paid) return 'PAID';

    const now = new Date();
    now.setHours(0,0,0,0);
    
    if (inst.dueDate < now) return 'OVERDUE';
    
    const fiveDaysFromNow = new Date(now);
    fiveDaysFromNow.setDate(now.getDate() + 5);
    if (inst.dueDate <= fiveDaysFromNow) return 'COMING_SOON';
    
    return 'FUTURE';
  }

  getStatusClass(inst: Installment): { [key: string]: boolean } {
    const status = this.getStatus(inst);
    return {
      'overdue': status === 'OVERDUE',
      'coming-soon': status === 'COMING_SOON',
      'paid': status === 'PAID',
      'future': status === 'FUTURE'
    };
  }

  getStatusLabel(status: InstallmentStatus): string {
    const labels = {
      'PAID': 'Saldada',
      'OVERDUE': 'Vencida',
      'COMING_SOON': 'Próxima',
      'FUTURE': 'Pendiente'
    };
    return labels[status];
  }

  addNewPurchase() {
    const id = this.person()?.id;
    this.router.navigate(['/purchase'], { queryParams: { personId: id } });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  goToPayment() {
    const id = this.person()?.id;
    this.router.navigate(['/payment', id]);
  }
}
