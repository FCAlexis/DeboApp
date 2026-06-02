import { Component, inject, signal, computed, AfterViewInit, OnDestroy, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DebtStateService } from '../../core/services/debt-state.service';
import { Chart, registerables } from 'chart.js/auto';

Chart.register(...registerables);

export type Period = '6m' | '1y' | 'all';
export type Trend = 'up' | 'down' | 'flat';

export interface MonthlyTrend {
  month: string;
  totalCents: number;
  paidCents: number;
  remainingCents: number;
}

export interface RecoveryTrend {
  rate: number;
  trend: Trend;
}

export interface ExportData {
  period: Period;
  debtTrend: MonthlyTrend[];
  persons: { id: string; name: string; owedCents: number; paidCents: number }[];
  recoveryRate: number;
  totalDebt: number;
  totalRecovered: number;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsComponent implements AfterViewInit, OnDestroy {
  private state = inject(DebtStateService);

  // --- State ---
  period = signal<Period>('6m');

  // --- Chart instances ---
  private trendChart: Chart<'bar'> | null = null;
  private personChart: Chart<'bar'> | null = null;
  private distributionChart: Chart<'doughnut'> | null = null;

  // --- Computed ---

  /** Recovery rate with trend direction */
  recoveryWithTrend = computed<RecoveryTrend>(() => ({
    rate: this.state.recoveryRate(),
    trend: this.calculateTrend(),
  }));

  /** Monthly trend data filtered by the selected period */
  filteredTrend = computed<MonthlyTrend[]>(() => {
    const all = this.state.monthlyInstallments();
    return this.filterByPeriod(all);
  });

  /** Persons enriched for the report view */
  reportPersons = computed(() => this.state.personsWithPaid());

  /** Total debt for the current period (from filteredTrend) */
  periodTotalDebt = computed(() =>
    this.filteredTrend().reduce((acc, m) => acc + m.remainingCents, 0)
  );

  /** Total recovered in period (from filteredTrend) */
  periodTotalRecovered = computed(() =>
    this.filteredTrend().reduce((acc, m) => acc + m.paidCents, 0)
  );

  /** Trend chart labels (months) */
  trendLabels = computed(() => this.filteredTrend().map(m => {
    const [y, mon] = m.month.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[parseInt(mon) - 1]} ${y}`;
  }));

  /** Trend chart data (remaining per month) */
  trendData = computed(() => this.filteredTrend().map(m => m.remainingCents / 100));

  /** Person chart labels */
  personLabels = computed(() => this.reportPersons().map(p => p.name));

  /** Person chart owed data */
  personOwedData = computed(() => this.reportPersons().map(p => p.owedCents / 100));

  /** Person chart paid data */
  personPaidData = computed(() => this.reportPersons().map(p => p.paidCents / 100));

  /** Distribution chart labels (persons with payments) */
  distributionLabels = computed(() =>
    this.reportPersons().filter(p => p.paidCents > 0).map(p => p.name)
  );

  /** Distribution chart data */
  distributionData = computed(() =>
    this.reportPersons().filter(p => p.paidCents > 0).map(p => p.paidCents / 100)
  );

  /** Whether the distribution chart should show empty state */
  hasDistributionData = computed(() => this.distributionData().length > 0);

  /** Track chart options with proper typing */
  private readonly barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f0f0f0' },
        ticks: { color: '#8E8E8E', font: { size: 11 } },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#8E8E8E', font: { size: 11 } },
      },
    },
  } as any;

  constructor() {
    // Reactively update charts when data changes
    effect(() => {
      // Read signals to establish reactivity
      this.filteredTrend();
      this.reportPersons();
      this.updateCharts();
    });
  }

  ngAfterViewInit() {
    if (typeof document !== 'undefined') {
      this.initCharts();
    }
  }

  ngOnDestroy() {
    this.trendChart?.destroy();
    this.personChart?.destroy();
    this.distributionChart?.destroy();
  }

  // --- Chart initialization ---

  private initCharts() {
    const trendCanvas = document.getElementById('debtTrendChart') as HTMLCanvasElement;
    const personCanvas = document.getElementById('personChart') as HTMLCanvasElement;
    const distributionCanvas = document.getElementById('distributionChart') as HTMLCanvasElement;

    if (trendCanvas) {
      this.trendChart = new Chart(trendCanvas, {
        type: 'bar',
        data: this.getTrendChartData(),
        options: this.barChartOptions,
      });
    }

    if (personCanvas) {
      this.personChart = new Chart(personCanvas, {
        type: 'bar',
        data: this.getPersonChartData(),
        options: {
          ...this.barChartOptions,
          plugins: {
            legend: { display: true, position: 'top' as const },
          },
        } as any,
      });
    }

    if (distributionCanvas) {
      this.distributionChart = new Chart(distributionCanvas, {
        type: 'doughnut',
        data: this.getDistributionChartData(),
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'right' as const },
          },
        } as any,
      });
    }
  }

  private updateCharts() {
    if (this.trendChart) {
      this.trendChart.data = this.getTrendChartData();
      this.trendChart.update();
    }
    if (this.personChart) {
      this.personChart.data = this.getPersonChartData();
      this.personChart.update();
    }
    if (this.distributionChart) {
      this.distributionChart.data = this.getDistributionChartData();
      this.distributionChart.update();
    }
  }

  private getTrendChartData() {
    return {
      labels: this.trendLabels(),
      datasets: [{
        label: 'Pendiente',
        data: this.trendData(),
        backgroundColor: '#B8C0FF',
        borderRadius: 8,
      }],
    };
  }

  private getPersonChartData() {
    return {
      labels: this.personLabels(),
      datasets: [
        {
          label: 'Debe',
          data: this.personOwedData(),
          backgroundColor: '#FFB7B2',
          borderRadius: 8,
        },
        {
          label: 'Pagó',
          data: this.personPaidData(),
          backgroundColor: '#C1E1C1',
          borderRadius: 8,
        },
      ],
    };
  }

  private getDistributionChartData() {
    const colors = ['#B8C0FF', '#FFD8B1', '#C1E1C1', '#FDFD96', '#FFB7B2', '#D4A5FF', '#A5D6FF'];
    return {
      labels: this.distributionLabels(),
      datasets: [{
        data: this.distributionData(),
        backgroundColor: colors.slice(0, this.distributionData().length),
        borderWidth: 0,
        spacing: 4,
      }],
    };
  }

  // --- Period filtering ---

  private filterByPeriod(all: MonthlyTrend[]): MonthlyTrend[] {
    const now = new Date();
    const months = this.getPeriodMonths();

    // Generate all expected month keys for the period
    const expectedMonths = new Set<string>();
    for (const m of months) {
      expectedMonths.add(m);
    }

    // Build a map of existing data
    const dataMap = new Map<string, MonthlyTrend>();
    for (const item of all) {
      dataMap.set(item.month, item);
    }

    // Result: existing data for months with data, zeros for months without
    const result: MonthlyTrend[] = [];
    for (const m of months) {
      if (dataMap.has(m)) {
        result.push(dataMap.get(m)!);
      } else {
        result.push({ month: m, totalCents: 0, paidCents: 0, remainingCents: 0 });
      }
    }

    return result;
  }

  private getPeriodMonths(): string[] {
    const now = new Date();
    const months: string[] = [];
    let count: number;

    switch (this.period()) {
      case '6m':
        count = 6;
        break;
      case '1y':
        count = 12;
        break;
      case 'all': {
        // Return all months from the data
        const all = this.state.monthlyInstallments();
        if (all.length === 0) return [];
        // Generate from first data month to current month
        const first = all[0].month;
        const [firstY, firstM] = first.split('-').map(Number);
        const nowY = now.getFullYear();
        const nowM = now.getMonth() + 1;

        let curY = firstY;
        let curM = firstM;
        while (curY < nowY || (curY === nowY && curM <= nowM)) {
          months.push(`${curY}-${String(curM).padStart(2, '0')}`);
          curM++;
          if (curM > 12) {
            curM = 1;
            curY++;
          }
        }
        return months;
      }
    }

    // Generate last N months
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    return months;
  }

  // --- Trend calculation ---

  calculateTrend(): Trend {
    const filtered = this.filteredTrend();
    if (filtered.length < 2) return 'flat';

    const half = Math.floor(filtered.length / 2);
    const firstHalf = filtered.slice(0, half);
    const secondHalf = filtered.slice(half);

    const firstRate = this.calcRecoveryRate(firstHalf);
    const secondRate = this.calcRecoveryRate(secondHalf);

    if (secondRate > firstRate) return 'up';
    if (secondRate < firstRate) return 'down';
    return 'flat';
  }

  private calcRecoveryRate(data: MonthlyTrend[]): number {
    const total = data.reduce((acc, m) => acc + m.totalCents, 0);
    const paid = data.reduce((acc, m) => acc + m.paidCents, 0);
    if (total === 0) return 0;
    return paid / total;
  }

  // --- Export ---

  buildExportData(): ExportData {
    return {
      period: this.period(),
      debtTrend: this.filteredTrend(),
      persons: this.reportPersons(),
      recoveryRate: this.state.recoveryRate(),
      totalDebt: this.periodTotalDebt(),
      totalRecovered: this.periodTotalRecovered(),
    };
  }

  exportCSV(): Blob | null {
    const data = this.buildExportData();
    const hasData = data.debtTrend.some(m => m.totalCents > 0) ||
                    data.persons.some(p => p.owedCents > 0 || p.paidCents > 0);
    if (!hasData) return null;

    let csv = 'Periodo,Cuotas Totales,Cuotas Pagadas,Cuotas Restantes\n';
    for (const m of data.debtTrend) {
      csv += `${m.month},${m.totalCents},${m.paidCents},${m.remainingCents}\n`;
    }
    csv += '\nPersona,Debe,Pagó\n';
    for (const p of data.persons) {
      csv += `${p.name},${p.owedCents},${p.paidCents}\n`;
    }
    csv += `\nTasa de Recuperación,${data.recoveryRate}%\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `deboapp-report-${this.period()}.csv`);
    return blob;
  }

  exportJSON(): Blob | null {
    const data = this.buildExportData();
    const hasData = data.debtTrend.some(m => m.totalCents > 0) ||
                    data.persons.some(p => p.owedCents > 0 || p.paidCents > 0);
    if (!hasData) return null;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    this.downloadBlob(blob, `deboapp-report-${this.period()}.json`);
    return blob;
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
