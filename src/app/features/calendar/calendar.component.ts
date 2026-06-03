import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  CalendarMonthViewComponent,
  CalendarDatePipe,
  CalendarEvent,
  CalendarMonthViewBeforeRenderEvent,
  CalendarMonthViewDay,
} from 'angular-calendar';
import { addMonths, subMonths, isSameDay, isSameMonth, startOfDay } from 'date-fns';
import { DebtStateService } from '../../core/services/debt-state.service';

interface InstallmentEventMeta {
  personId: string;
  personName: string;
  amountCents: number;
  amountPaidCents: number;
  dueDate: Date;
  status: 'overdue' | 'soon' | 'future';
}

const DAY_MS = 1000 * 60 * 60 * 24;

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    CalendarMonthViewComponent,
    CalendarDatePipe,
  ],
  template: `
    <div class="cal-screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Calendario</h1>
        <div class="header-placeholder"></div>
      </header>

      <main class="layout">
        <div class="cal-nav">
          <button class="cal-nav-btn" (click)="previousMonth()" aria-label="Mes anterior">‹</button>
          <h2 class="cal-title">{{ viewDate() | calendarDate:'monthViewTitle' }}</h2>
          <button class="cal-nav-btn" (click)="nextMonth()" aria-label="Mes siguiente">›</button>
          <button class="cal-today-btn" (click)="goToday()">Hoy</button>
        </div>

        @if (summaryText()) {
          <div class="cal-summary">{{ summaryText() }}</div>
        }

        <div class="cal-legend">
          <span class="cal-legend-item"><span class="legend-dot dot-overdue"></span> Vencido</span>
          <span class="cal-legend-item"><span class="legend-dot dot-soon"></span> Próximos 3 días</span>
          <span class="cal-legend-item"><span class="legend-dot dot-future"></span> Futuro</span>
        </div>

        <mwl-calendar-month-view
          [viewDate]="viewDate()"
          [events]="events()"
          [activeDayIsOpen]="activeDayIsOpen()"
          [weekStartsOn]="1"
          (dayClicked)="onDayClicked($event)"
          (beforeViewRender)="onBeforeRender($event)">
        </mwl-calendar-month-view>
      </main>
    </div>
  `,
  styles: [`
    .cal-screen {
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
      max-width: 1000px;
      margin: 0 auto;
    }

    .cal-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
    }

    .cal-title {
      flex: 1;
      margin: 0;
      font-size: 1.2rem;
      font-weight: 600;
      text-transform: capitalize;
      line-height: 1.2;
    }

    .cal-nav-btn {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      width: 40px;
      height: 40px;
      font-size: 1.3rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-main);
      transition: all 0.2s;
    }

    .cal-nav-btn:hover {
      background: var(--bg-light);
      border-color: var(--primary-color);
    }

    .cal-today-btn {
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .cal-today-btn:hover {
      opacity: 0.9;
    }

    .cal-summary {
      padding: 10px 14px;
      border-radius: 10px;
      margin-bottom: 12px;
      font-size: 0.9rem;
      background: white;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
    }

    .cal-legend {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
      flex-wrap: wrap;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .cal-legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }

    .dot-overdue { background: var(--danger-color); }
    .dot-soon    { background: var(--warning-color); }
    .dot-future  { background: var(--success-color); }

    :host ::ng-deep .cal-month-view {
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      background: white;
    }

    :host ::ng-deep .cal-month-view .cal-header {
      background: var(--bg-light);
      border-bottom: 1px solid var(--border-color);
    }

    :host ::ng-deep .cal-month-view .cal-header .cal-cell {
      padding: 10px 0;
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
    }

    :host ::ng-deep .cal-month-view .cal-cell-row {
      border-bottom: 1px solid var(--border-color);
    }

    :host ::ng-deep .cal-month-view .cal-cell-row:last-child {
      border-bottom: none;
    }

    :host ::ng-deep .cal-month-view .cal-cell-row:hover {
      background: transparent;
    }

    :host ::ng-deep .cal-month-view .cal-day-cell {
      min-height: 90px;
      cursor: pointer;
      border-right: 1px solid var(--border-color);
      transition: background 0.15s;
    }

    :host ::ng-deep .cal-month-view .cal-day-cell:last-child {
      border-right: none;
    }

    :host ::ng-deep .cal-month-view .cal-day-cell:hover {
      background: var(--bg-light);
    }

    :host ::ng-deep .cal-month-view .cal-day-cell.cal-today {
      background: transparent;
    }

    :host ::ng-deep .cal-month-view .cal-day-cell.cal-weekend .cal-day-number {
      color: var(--text-muted);
    }

    :host ::ng-deep .cal-month-view .cal-day-cell.cal-out-month {
      background: transparent;
    }

    :host ::ng-deep .cal-month-view .cal-day-cell.cal-out-month .cal-day-number {
      opacity: 0.3;
    }

    :host ::ng-deep .cal-month-view .cal-day-cell.cal-out-month:hover {
      background: transparent;
    }

    :host ::ng-deep .cal-month-view .cal-day-number {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-main);
      margin: 6px 0 0 8px;
      width: 28px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    :host ::ng-deep .cal-month-view .cal-day-cell.cal-today .cal-day-number {
      background: var(--primary-color);
      color: white;
      border-radius: 50%;
    }

    :host ::ng-deep .cal-month-view .cal-cell-top {
      min-height: 60px;
      padding-bottom: 4px;
    }

    :host ::ng-deep .cal-month-view .cal-event {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      display: inline-block;
      margin: 1px;
    }

    :host ::ng-deep .cal-month-view .cal-day-badge {
      background: var(--danger-color);
      color: white;
      font-size: 0.65rem;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      line-height: 18px;
      text-align: center;
      padding: 0 4px;
      border-radius: 99px;
      margin-top: 2px;
    }

    :host ::ng-deep .cal-day-overdue .cal-cell-top {
      background: rgba(239, 68, 68, 0.06);
      border-radius: 4px;
      position: relative;
    }

    :host ::ng-deep .cal-day-overdue .cal-cell-top::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--danger-color);
      border-radius: 3px 3px 0 0;
    }

    :host ::ng-deep .cal-day-soon .cal-cell-top {
      background: rgba(245, 158, 11, 0.06);
      border-radius: 4px;
      position: relative;
    }

    :host ::ng-deep .cal-day-soon .cal-cell-top::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--warning-color);
      border-radius: 3px 3px 0 0;
    }

    :host ::ng-deep .cal-day-future .cal-cell-top {
      background: rgba(34, 197, 94, 0.06);
      border-radius: 4px;
      position: relative;
    }

    :host ::ng-deep .cal-day-future .cal-cell-top::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--success-color);
      border-radius: 3px 3px 0 0;
    }

    @media (max-width: 600px) {
      .header {
        padding: 0.75rem 1rem;
      }

      .back-btn {
        min-width: 44px;
        min-height: 44px;
      }

      .title {
        font-size: 1.1rem;
      }

      .layout {
        padding: 1rem 0.5rem;
      }

      .cal-title {
        font-size: 1rem;
      }

      :host ::ng-deep .cal-month-view .cal-day-cell {
        min-height: 64px;
      }

      :host ::ng-deep .cal-month-view .cal-cell-top {
        min-height: 44px;
      }

      :host ::ng-deep .cal-month-view .cal-day-number {
        font-size: 0.8rem;
        width: 24px;
        height: 24px;
        margin: 4px 0 0 6px;
      }

      :host ::ng-deep .cal-month-view .cal-header .cal-cell {
        font-size: 0.65rem;
        padding: 8px 0;
      }

      .cal-legend {
        gap: 10px;
        font-size: 0.75rem;
      }
    }

    @media (max-width: 400px) {
      :host ::ng-deep .cal-month-view .cal-day-cell {
        min-height: 48px;
      }

      :host ::ng-deep .cal-month-view .cal-cell-top {
        min-height: 36px;
        padding-bottom: 2px;
      }

      :host ::ng-deep .cal-month-view .cal-day-number {
        font-size: 0.7rem;
        width: 22px;
        height: 22px;
        margin: 3px 0 0 4px;
      }

      :host ::ng-deep .cal-month-view .cal-event {
        width: 5px;
        height: 5px;
      }

      .cal-nav-btn {
        width: 36px;
        height: 36px;
        font-size: 1.1rem;
      }

      .cal-today-btn {
        padding: 6px 12px;
        font-size: 0.85rem;
      }
    }

    @media (prefers-color-scheme: dark) {
      .header {
        background: var(--surface-card);
      }

      .cal-nav-btn {
        background: var(--surface-card);
        border-color: var(--border-color);
        color: var(--text-main);
      }

      .cal-summary {
        background: var(--surface-card);
        border-color: var(--border-color);
        color: var(--text-muted);
      }
    }
  `],
})
export class CalendarComponent {
  readonly viewDate = signal(new Date());
  readonly activeDayIsOpen = signal(false);

  readonly state = inject(DebtStateService);
  private router = inject(Router);

  readonly events = computed<CalendarEvent<InstallmentEventMeta>[]>(() => {
    const now = Date.now();
    return this.state.allPendingInstallments().map(inst => {
      const diff = (inst.dueDate.getTime() - now) / DAY_MS;
      let status: InstallmentEventMeta['status'];
      let color: { primary: string; secondary: string };

      if (diff < 0) {
        status = 'overdue';
        color = { primary: '#ef4444', secondary: '#fecaca' };
      } else if (diff <= 3) {
        status = 'soon';
        color = { primary: '#f59e0b', secondary: '#fde68a' };
      } else {
        status = 'future';
        color = { primary: '#22c55e', secondary: '#bbf7d0' };
      }

      return {
        start: startOfDay(inst.dueDate),
        title: `${inst.personName}: $${((inst.amountCents - inst.amountPaidCents) / 100).toFixed(0)}`,
        color,
        meta: { ...inst, status },
      };
    });
  });

  readonly summaryText = computed(() => {
    const now = Date.now();
    let overdue = 0;
    let upcoming30 = 0;

    for (const inst of this.state.allPendingInstallments()) {
      const diff = inst.dueDate.getTime() - now;
      if (diff < 0) {
        overdue++;
      } else if (diff <= 30 * DAY_MS) {
        upcoming30++;
      }
    }

    if (overdue === 0 && upcoming30 === 0) return 'No hay cuotas pendientes';
    const parts: string[] = [];
    if (overdue > 0) parts.push(`${overdue} vencida${overdue !== 1 ? 's' : ''}`);
    if (upcoming30 > 0) parts.push(`${upcoming30} próxima${upcoming30 !== 1 ? 's' : ''} en 30 días`);
    return parts.join(', ');
  });

  onDayClicked({ day }: { day: CalendarMonthViewDay }): void {
    if (isSameMonth(day.date, this.viewDate())) {
      this.activeDayIsOpen.set(
        isSameDay(day.date, this.viewDate()) && this.activeDayIsOpen()
          ? false
          : day.events.length > 0
      );
      this.viewDate.set(day.date);
    }
  }

  onBeforeRender(renderEvent: CalendarMonthViewBeforeRenderEvent): void {
    renderEvent.body.forEach(day => {
      const worst = day.events.reduce<string | null>((w, e) => {
        const s = (e.meta as InstallmentEventMeta)?.status;
        if (s === 'overdue') return 'overdue';
        if (s === 'soon' && w !== 'overdue') return 'soon';
        return w ?? 'future';
      }, null);
      if (worst) day.cssClass = `cal-day-${worst}`;
    });
  }

  previousMonth(): void {
    this.viewDate.set(subMonths(this.viewDate(), 1));
    this.activeDayIsOpen.set(false);
  }

  nextMonth(): void {
    this.viewDate.set(addMonths(this.viewDate(), 1));
    this.activeDayIsOpen.set(false);
  }

  goToday(): void {
    this.viewDate.set(new Date());
    this.activeDayIsOpen.set(false);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}
