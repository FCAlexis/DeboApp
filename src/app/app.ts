import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DebtService } from './core/services/debt.service';
import { NotificationContainerComponent } from './core/components/notification-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private debtService = inject(DebtService);
  protected readonly title = signal('web-app');

  async ngOnInit() {
    await this.debtService.loadInitialData();
  }
}
