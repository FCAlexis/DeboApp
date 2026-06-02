import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css'],
})
export class CalendarComponent {
  readonly viewDate = signal(new Date());
  readonly activeDayIsOpen = signal(false);

  readonly state = inject(DebtStateService);

  /** Transform pending installments into CalendarEvent[] with color + status */
  readonly events = computed<CalendarEvent<InstallmentEventMeta>[]>(() => {
    const now = Date.now();
    return this.state.allPendingInstallments().map(inst => {
      const diff = (inst.dueDate.getTime() - now) / DAY_MS;
      let status: InstallmentEventMeta['status'];
      let color: { primary: string; secondary: string };

      if (diff < 0) {
        status = 'overdue';
        color = { primary: '#ef4444', secondary: '#fecaca' }; // red
      } else if (diff <= 3) {
        status = 'soon';
        color = { primary: '#f59e0b', secondary: '#fde68a' }; // amber
      } else {
        status = 'future';
        color = { primary: '#22c55e', secondary: '#bbf7d0' }; // green
      }

      return {
        start: startOfDay(inst.dueDate),
        title: `${inst.personName}: $${((inst.amountCents - inst.amountPaidCents) / 100).toFixed(0)}`,
        color,
        meta: { ...inst, status },
      };
    });
  });

  /** Summary text showing overdue and upcoming counts */
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

  /** Handle day click: toggle active day detail panel */
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

  /** Inject CSS class per day cell based on worst event status */
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
}
