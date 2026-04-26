import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DebtService } from './core/services/debt.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
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
