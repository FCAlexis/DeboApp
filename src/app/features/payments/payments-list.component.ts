import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DebtStateService } from '../../core/services/debt-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { formatCurrency } from '../../core/utils/format-currency';

@Component({
  selector: 'app-payments-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="payments-screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Historial de Pagos</h1>
        <div class="header-placeholder"></div>
      </header>

      <main class="content">
        <div class="summary-header">
          <div class="status-badge">Global</div>
        </div>
        <div class="summary-grid">
          <div class="summary-card success">
            <span class="label">Total Recuperado</span>
            <span class="value">{{ formatCurrency(state.totalRecovered()) }}</span>
          </div>
          <div class="summary-card">
            <span class="label">Transacciones</span>
            <span class="value">{{ state.payments().length }}</span>
          </div>
        </div>
        <div class="filter-bar">
          <div class="search-container">
            <i class="bi bi-search"></i>
            <input type="text" 
                   placeholder="Buscar cliente..." 
                   (input)="updateSearch($event)"
                   class="search-input">
          </div>
        </div>

        <div class="payments-list">
          @for (payment of filteredPayments(); track payment.id) {
            <div class="payment-item" (click)="goToPerson(payment.personId)">
              <div class="payment-date">
    <span class="day">{{ payment.paymentDate.getDate() }}</span>
    <span class="month">{{ getMonthName(payment.paymentDate) }}</span>
  </div>
  <div class="payment-avatar">{{ payment.personName.charAt(0).toUpperCase() }}</div>
  <div class="payment-info">
    <div class="payment-name">{{ payment.personName }}</div>
    <div class="payment-meta">Recibido el {{ formatDate(payment.paymentDate) }}</div>
  </div>
              <div class="payment-amount">
                <div class="amount-value text-success">+ {{ formatCurrency(payment.amountCents) }}</div>
                <span class="payment-status">Completado</span>
              </div>
              <i class="bi bi-chevron-right chevron-right"></i>
            </div>
          } @empty {
            <div class="empty-state">
              <i class="bi bi-cash-stack"></i>
              <p>Aún no hay registros de pagos.</p>
            </div>
          }
        </div>
      </main>
    </div>
  `,
  styles: [`
    .payments-screen {
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

    .status-badge {
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 0.75rem;
      font-weight: 700;
      background: var(--bg-light);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
    }

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

    .summary-card.success {
      border-left: 4px solid var(--success-color);
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
      justify-content: flex-start;
      margin-bottom: 24px;
    }

    .search-container {
      position: relative;
      width: 100%;
      max-width: 400px;
      display: flex;
      align-items: center;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 0 12px;
      transition: all 0.2s;
    }

    .search-container:focus-within {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px rgba(108, 92, 131, 0.1);
    }

    .search-container i {
      color: var(--text-muted);
      font-size: 1rem;
    }

    .search-input {
      border: none;
      background: transparent;
      padding: 12px;
      width: 100%;
      outline: none;
      font-size: 0.875rem;
      color: var(--text-main);
    }

    .payments-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .payment-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: var(--radius-md);
      background: white;
      border: 1px solid var(--border-color);
      transition: all 0.2s;
      cursor: pointer;
    }

    .payment-item:hover {
      background: #fbfbff;
      border-color: var(--primary-color);
      transform: translateY(-2px);
    }

    .payment-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: #e8f5e9;
      border-radius: 10px;
      margin-right: 16px;
      border: 1px solid #c8e6c9;
    }

    .payment-date .day {
      font-size: 1rem;
      font-weight: 700;
      color: #2e7d32;
    }

    .payment-date .month {
      font-size: 0.65rem;
      font-weight: 700;
      color: #66bb6a;
      text-transform: uppercase;
    }

    .payment-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      margin-right: 12px;
    }

    .payment-info {
      flex: 1;
    }

    .payment-name {
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 2px;
    }

    .payment-meta {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .payment-amount {
      text-align: right;
      margin-right: 12px;
    }

    .amount-value {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .text-success {
      color: var(--success-color) !important;
    }

    .payment-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      margin-top: 4px;
      background: #e8f5e9;
      color: #2e7d32;
    }

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
export class PaymentsListComponent {
  public state = inject(DebtStateService);
  private settings = inject(SettingsService);
  private router = inject(Router);

  public searchTerm = signal('');

  public filteredPayments = computed(() => {
    const query = this.searchTerm().toLowerCase();
    const all = this.state.globalPaymentHistory();
    
    if (!query) return all;
    return all.filter(p => p.personName.toLowerCase().includes(query));
  });

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }

  formatCurrency = (cents: number): string => {
    return formatCurrency(cents, this.settings.currency());
  };

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

  goToPerson(id: string) {
    this.router.navigate(['/person', id]);
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
