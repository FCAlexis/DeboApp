import { Component, inject, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DebtStateService } from '../../core/services/debt-state.service';
import { Chart, ChartConfiguration, ChartData } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar Desktop -->
      <aside class="sidebar d-none d-lg-block">
        <div class="sidebar-brand">
          <i class="bi bi-wallet2"></i> DeboApp
        </div>
        <nav class="sidebar-nav">
          <a href="#" class="nav-link active">
            <i class="bi bi-house-door-fill"></i>
            <span>Resumen</span>
          </a>
          <a href="#" class="nav-link">
            <i class="bi bi-receipt"></i>
            <span>Deudas</span>
          </a>
          <a href="#" class="nav-link">
            <i class="bi bi-cash-coin"></i>
            <span>Pagos</span>
          </a>
          <a href="#" class="nav-link" (click)="addPurchase()">
            <i class="bi bi-cart3"></i>
            <span>Compras</span>
          </a>
          <a href="#" class="nav-link" (click)="addPerson()">
            <i class="bi bi-people-fill"></i>
            <span>Personas</span>
          </a>
        </nav>
      </aside>

      <main class="main-content">
        <!-- Header -->
        <header class="header">
          <h1 class="header-title">Hola, Usuario 👋</h1>
          <div class="header-actions">
            <div class="btn-icon"><i class="bi bi-bell"></i></div>
            <div class="btn-icon"><i class="bi bi-person-circle"></i></div>
          </div>
        </header>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total que debés</div>
            <div class="stat-value">{{ formatCurrency(state.totalDebt()) }}</div>
            <div class="stat-footer">
              <span>en {{ state.personsWithBalance().length }} deudas</span>
              <div class="stat-icon wallet"><i class="bi bi-wallet"></i></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Vencido</div>
            <div class="stat-value text-danger">$ 0</div>
            <div class="stat-footer">
              <span class="text-danger">sin vencimientos</span>
              <div class="stat-icon calendar"><i class="bi bi-calendar-x"></i></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Próximos 30 días</div>
            <div class="stat-value">$ 0</div>
            <div class="stat-footer">
              <span>sin cuotas próximas</span>
              <div class="stat-icon clock"><i class="bi bi-clock"></i></div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">A tu favor</div>
            <div class="stat-value text-success">$ 0</div>
            <div class="stat-footer">
              <span class="text-success">saldo neutro</span>
              <div class="stat-icon arrow-up"><i class="bi bi-arrow-up"></i></div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Deudas por Mes</h3>
              <button class="btn-sm-custom">Próximos 6 meses</button>
            </div>
            <div class="chart-container">
              <canvas id="debtsChart"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <div class="chart-header">
              <h3 class="chart-title">Deudas por Persona</h3>
            </div>
            <div class="chart-container">
              <canvas id="peopleChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Content Section -->
        <div class="content-grid">
          <section class="debt-section">
            <div class="section-header">
              <h2>Próximas Deudas</h2>
              <a href="#" class="view-all">Ver todas</a>
            </div>
            <div class="debt-list">
              @for (person of state.personsWithBalance(); track person.id) {
                <div class="debt-item" (click)="goToDetails(person.id)">
                  <div class="debt-date">
                    <span class="month">MAY</span>
                    <span class="day">15</span>
                  </div>
                  <div class="debt-avatar">{{ person.name.charAt(0).toUpperCase() }}</div>
                  <div class="debt-info">
                    <div class="debt-name">{{ person.name }}</div>
                    <div class="debt-desc">Saldos pendientes</div>
                  </div>
                  <div class="debt-amount">
                    <div class="debt-value">{{ formatCurrency(person.balance) }}</div>
                    <span class="debt-badge badge-info">En espera</span>
                  </div>
                  <i class="bi bi-chevron-right chevron-right"></i>
                </div>
              } @empty {
                <div class="empty-state">
                  <div class="empty-icon">👤</div>
                  <p>Sin deudas pendientes.</p>
                </div>
              }
            </div>
          </section>

          <section class="action-section">
            <div class="payment-card" (click)="addPurchase()">
              <div class="payment-icon"><i class="bi bi-plus-lg"></i></div>
              <div class="payment-title">Nuevo Registro</div>
              <div class="payment-desc">Registrá una compra o pago rápidamente</div>
            </div>
          </section>
        </div>
      </main>

      <!-- Bottom Nav Mobile -->
      <nav class="bottom-nav d-lg-none">
        <a href="#" class="bottom-nav-item active">
          <i class="bi bi-house-door-fill"></i>
          <span>Resumen</span>
        </a>
        <a href="#" class="bottom-nav-item" (click)="addPerson()">
          <i class="bi bi-people-fill"></i>
          <span>Personas</span>
        </a>
        <div class="bottom-nav-center" (click)="addPurchase()">
          <i class="bi bi-plus-lg"></i>
        </div>
        <a href="#" class="bottom-nav-item">
          <i class="bi bi-receipt"></i>
          <span>Deudas</span>
        </a>
        <a href="#" class="bottom-nav-item">
          <i class="bi bi-three-dots"></i>
          <span>Más</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-light);
    }

    /* Sidebar */
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: white;
      border-right: 1px solid var(--border-color);
      padding: 20px 0;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 1000;
    }
    .sidebar-brand {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      padding: 0 24px 30px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 12px;
    }
    .nav-link {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      color: var(--text-muted);
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.3s;
      font-weight: 500;
      gap: 12px;
    }
    .nav-link:hover, .nav-link.active {
      background: #ede9fe;
      color: var(--primary-color);
    }

    /* Main Content */
    .main-content {
      margin-left: var(--sidebar-width);
      padding: 24px;
      width: 100%;
      transition: margin-left 0.3s;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }
    .header-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }
    .btn-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      border: 1px solid var(--border-color);
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text-muted);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .stat-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 24px;
      border: 1px solid var(--border-color);
      transition: all 0.3s;
      cursor: default;
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }
    .stat-label {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-bottom: 8px;
      font-weight: 500;
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-main);
      margin-bottom: 8px;
    }
    .stat-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--text-muted);
    }
    .stat-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-icon.wallet { background: #ede9fe; color: var(--primary-color); }
    .stat-icon.calendar { background: #ffeaa7; color: var(--danger-color); }
    .stat-icon.clock { background: #dfe6e9; color: #0984e3; }
    .stat-icon.arrow-up { background: #55efc4; color: var(--success-color); }
    .text-danger { color: var(--danger-color) !important; }
    .text-success { color: var(--success-color) !important; }

    /* Charts Section */
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    .chart-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 24px;
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .chart-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
    }
    .btn-sm-custom {
      padding: 6px 12px;
      font-size: 0.875rem;
      border-radius: 6px;
      border: 1px solid var(--border-color);
      background: white;
      color: var(--text-muted);
      cursor: pointer;
    }
    .chart-container {
      position: relative;
      height: 250px;
      width: 100%;
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .section-header h2 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 0;
    }
    .view-all {
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Debt Items */
    .debt-list {
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
      font-size: 0.7rem;
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
    .badge-info {
      background: #d1ecf1;
      color: #0c5460;
    }
    .chevron-right {
      color: #b2bec3;
      font-size: 1.2rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      display: block;
      opacity: 0.5;
    }

    .payment-card {
      background: white;
      border-radius: var(--radius-lg);
      padding: 24px;
      border: 2px dashed var(--border-color);
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
    }
    .payment-card:hover {
      border-color: var(--primary-color);
      background: #fafafa;
    }
    .payment-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--bg-light);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      color: var(--primary-color);
      font-size: 1.5rem;
    }
    .payment-title {
      font-weight: 600;
      color: var(--text-main);
      margin-bottom: 4px;
    }
    .payment-desc {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    /* Mobile Bottom Nav */
    .bottom-nav {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-top: 1px solid var(--border-color);
      padding: 8px 0;
      z-index: 1000;
      justify-content: space-around;
      align-items: center;
    }
    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px 12px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.75rem;
      gap: 4px;
    }
    .bottom-nav-item.active {
      color: var(--primary-color);
    }
    .bottom-nav-item i {
      font-size: 1.25rem;
    }
    .bottom-nav-center {
      width: 56px;
      height: 56px;
      background: var(--primary-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: -28px;
      box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
    }

    /* Responsive */
    @media (max-width: 992px) {
      .main-content {
        margin-left: 0;
        padding: 16px;
        padding-bottom: 80px;
      }
    }
  `]
})
export class DashboardComponent implements AfterViewInit {
  public state = inject(DebtStateService);
  private router = inject(Router);

  private debtsChart: Chart | null = null;
  private peopleChart: Chart | null = null;

  constructor() {
    effect(() => {
      this.state.personsWithBalance();
      this.state.installments();
      this.updateCharts();
    });
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  private initCharts() {
    const debtsCtx = document.getElementById('debtsChart') as HTMLCanvasElement;
    const peopleCtx = document.getElementById('peopleChart') as HTMLCanvasElement;

    if (debtsCtx) {
      this.debtsChart = new Chart(debtsCtx, {
        type: 'bar',
        data: this.getDebtsChartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { 
              beginAtZero: true, 
              grid: { color: '#f0f0f0' },
              ticks: { color: '#8E8E8E', font: { size: 11 } }
            },
            x: { grid: { display: false }, ticks: { color: '#8E8E8E', font: { size: 11 } } }
          }
        }
      });
    }

    if (peopleCtx) {
      this.peopleChart = new Chart(peopleCtx, {
        type: 'doughnut',
        data: this.getPeopleChartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { 
            legend: { display: false },
            // cutout se define en la configuración Delight del Doughnut
          }
        } as any
      });
    }
  }

  private updateCharts() {
    if (this.debtsChart) {
      this.debtsChart.data = this.getDebtsChartData();
      this.debtsChart.update();
    }
    if (this.peopleChart) {
      this.peopleChart.data = this.getPeopleChartData();
      this.peopleChart.update();
    }
  }

  private getDebtsChartData(): ChartData {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const data = new Array(6).fill(0);
    
    this.state.installments().forEach(inst => {
      const month = new Date(inst.dueDate).getMonth();
      if (month < 6) data[month] += inst.amountCents;
    });

    return {
      labels: months,
      datasets: [{
        label: 'Deudas',
        data: data.map(v => v / 100),
        backgroundColor: '#B8C0FF',
        borderRadius: 8,
      }]
    };
  }

  private getPeopleChartData(): ChartData {
    const persons = this.state.personsWithBalance();
    return {
      labels: persons.map(p => p.name),
      datasets: [{
        data: persons.map(p => p.balance / 100),
        backgroundColor: ['#B8C0FF', '#FFD8B1', '#C1E1C1', '#FDFD96', '#FFB7B2'],
        borderWidth: 0,
        spacing: 4
      }]
    };
  }

  formatCurrency(cents: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cents / 100);
  }

  getPaymentProgress(balance: number): number {
    if (balance <= 0) return 100;
    return 0;
  }

  goToDetails(personId: string) {
    this.router.navigate(['/person', personId]);
  }

  addPerson() {
    this.router.navigate(['/persons']);
  }

  addPurchase() {
    this.router.navigate(['/purchase']);
  }
}
