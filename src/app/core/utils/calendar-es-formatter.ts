import { Injectable } from '@angular/core';
import { CalendarDateFormatter, DateFormatterParams } from 'angular-calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

@Injectable()
export class CalendarEsFormatter extends CalendarDateFormatter {
  override monthViewTitle({ date }: DateFormatterParams): string {
    return format(date, 'MMMM yyyy', { locale: es });
  }

  override monthViewColumnHeader({ date }: DateFormatterParams): string {
    return format(date, 'EEEE', { locale: es });
  }

  override monthViewDayNumber({ date }: DateFormatterParams): string {
    return format(date, 'd', { locale: es });
  }
}
