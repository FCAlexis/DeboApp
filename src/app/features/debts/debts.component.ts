import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DebtStateService } from '../../core/services/debt-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { formatCurrency } from '../../core/utils/format-currency';

@Component({
  selector: 'app-debts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debts-screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Deudas Globales</h1>
        <div class="header-placeholder"></div>
      </header>

      <main class="content">
        <div class="summary-header">
          <div class="total-badge" [class]="'status-' + state.debtHealth().toLowerCase()">
            {{ state.debtHealth() }}
          </div>
        </div>
        <div class="summary-grid">
          <div class="summary-card">
            <span class="label">Total Pendiente</span>
            <span class="value">{{ formatCurrency(state.totalDebt()) }}</span>
          </div>
          <div class="summary-card danger">
            <span class="label">Vencido</span>
            <span class="value">{{ formatCurrency(overdueTotal()) }}</span>
          </div>
        </div>
        <div class="filter-bar">
          <button class="filter-btn" [class.active]="filter() === 'ALL'" (click)="setFilter('ALL')">Todos</button>
          <button class="filter-btn" [class.active]="filter() === 'OVERDUE'" (click)="setFilter('OVERDUE')">Vencidos</button>
          <button class="filter-btn" [class.active]="filter() === 'PENDING'" (click)="setFilter('PENDING')">Pendientes</button>
        </div>

        <div class="debts-list">
          @for (item of filteredDebts(); track item.id) {
            <div class="debt-item" (click)="goToPerson(item.personId)">
              <div class="debt-date">
                <span class="month">{{ getMonthName(item.dueDate) }}</span>
                <span class="day">{{ item.dueDate.getDate() }}</span>
              </div>
              <div class="debt-avatar">{{ item.personName.charAt(0).toUpperCase() }}</div>
              <div class="debt-info">
                <div class="debt-name">{{ item.personName }}</div>
                <div class="debt-desc">Cuota {{ item.number }}</div>
              </div>
              <div class="debt-amount">
                <div class="debt-value">{{ formatCurrency(item.amountCents - (item.amountPaidCents || 0)) }}</div>
                <span class="debt-badge" [class]="getStatusClass(item)">
                  {{ getStatusLabel(item) }}
                </span>
              </div>
              <i class="bi bi-chevron-right chevron-right"></i>
            </div>
          } @empty {
            <div class="empty-state">
              <i class="bi bi-check-circle-fill"></i>
              <p>No hay cuotas pendientes para mostrar.</p>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .debts-screen {
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

    .content {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .summary-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 20px;
    }

    .total-badge {
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status-sana { background: #e8f5e9; color: #2e7d32; }
    .status-en riesgo { background: #fff3e0; color: #ef6c00; }
    .status-critical { background: #ffebee; color: #c62828; }

    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      background: white;
      padding: 20px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .summary-card.danger {
      border-left: 4px solid var(--danger-color);
    }

    .summary-card .label {
      font-size: 0.875rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .summary-card .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .filter-bar {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
    }

    .filter-btn {
      padding: 8px 16px;
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: white;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .filter-btn.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .debts-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .debt-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: var(--radius-md);
      background: white;
      border: 1px solid var(--border-color);
      transition: all 0.2s;
      cursor: pointer;
    }

    .debt-item:hover {
      background: #fbfbff;
      border-color: var(--primary-color);
      transform: translateY(-2px);
    }

    .debt-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--bg-light);
      border-radius: 10px;
      margin-right: 16px;
      border: 1px solid var(--border-color);
    }

    .debt-date .month {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
    }

    .debt-date .day {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main);
    }

    .debt-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      margin-right: 12px;
    }

    .debt-info {
      flex: 1;
    }

    .debt-name {
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 2px;
    }

    .debt-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .debt-amount {
      text-align: right;
      margin-right: 12px;
    }

    .debt-value {
      font-weight: 700;
      color: var(--text-main);
      font-size: 1.1rem;
    }

    .debt-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      margin-top: 4px;
    }

    .badge-overdue { background: #ffebee; color: var(--danger-color); }
    .badge-pending { background: #e3f2fd; color: #1976d2; }
    .badge-coming-soon { background: #fff3e0; color: var(--warning-color); }

    .chevron-right {
      color: #b2bec3;
      font-size: 1.2rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .empty-state i {
      font-size: 3rem;
      opacity: 0.3;
    }
  `]
})
export class DebtsComponent {
  public state = inject(DebtStateService);
  private settings = inject(SettingsService);
  private router = inject(Router);

  public filter = signal<'ALL' | 'OVERDUE' | 'PENDING'>('ALL');

  public filteredDebts = computed(() => {
    const all = this.state.allPendingInstallments();
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return all.filter(i => {
      const due = new Date(i.dueDate);
      due.setHours(0, 0, 0, 0);
      const isOverdue = due < now;

      if (this.filter() === 'OVERDUE') return isOverdue;
      if (this.filter() === 'PENDING') return !isOverdue;
      return true;
    });
  });

  public overdueTotal = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return this.filteredDebts()
      .filter(i => {
        const due = new Date(i.dueDate);
        due.setHours(0,0,0,0);
        return due < now;
      })
      .reduce((acc, i) => acc + (i.amountCents - (i.amountPaidCents || 0)), 0);
  });

  setFilter(f: 'ALL' | 'OVERDUE' | 'PENDING') {
    this.filter.set(f);
  }

  formatCurrency = (cents: number): string => {
    return formatCurrency(cents, this.settings.currency());
  };

  getMonthName(date: Date): string {
    return date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase().substring(0, 3);
  }

  getStatusLabel(inst: any): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(inst.dueDate);
    due.setHours(0, 0, 0, 0);
    
    if (due < now) return 'Vencida';
    return 'Pendiente';
  }

  getStatusClass(inst: any): string {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(inst.dueDate);
    due.setHours(0, 0, 0, 0);
    
    return due < now ? 'badge-overdue' : 'badge-pending';
  }

  goToPerson(id: string) {
    this.router.navigate(['/person', id]);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
