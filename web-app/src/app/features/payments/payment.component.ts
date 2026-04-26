import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DebtService } from '../../core/services/debt.service';
import { DebtStateService } from '../../core/services/debt-state.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="payment-container">
      <header class="header">
        <button class="back-btn" (click)="goBack()">← Volver</button>
        <h1 class="title">Registrar Pago</h1>
      </header>

      <main class="content">
        <section class="form-card">
          <div class="person-info-header">
            <span class="label">Pagando a:</span>
            <strong class="name">{{ personName }}</strong>
          </div>

          <form (submit)="savePayment()" #paymentForm="ngForm">
            <div class="input-group">
              <label>Monto del Pago</label>
              <input 
                type="number" 
                name="amount" 
                [(ngModel)]="paymentAmount" 
                #amountModel="ngModel" 
                min="1" 
                required 
                placeholder="0"
                class="form-input">
            </div>

            <div class="info-box">
              <small>Cualquier monto ingresado será distribuido automáticamente a las cuotas más antiguas primero.</small>
            </div>

            <button type="submit" [disabled]="!paymentForm.form.valid" class="save-btn">
              Confirmar Pago
            </button>
          </form>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .payment-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #f8f9fa;
      min-height: 100vh;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .back-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 1rem;
    }

    .title {
      font-size: clamp(1.5rem, 5vw, 2.5rem);
      color: #333;
      margin: 0;
    }

    .form-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      max-width: 500px;
      margin: 0 auto;
    }

    .person-info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #eee;
    }

    .person-info-header .label {
      font-size: 0.9rem;
      color: #666;
    }

    .person-info-header .name {
      font-size: 1.1rem;
      color: #764ba2;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.2rem;
    }

    .input-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #666;
    }

    .form-input {
      padding: 0.8rem;
      border: 1px solid #ddd;
      border-radius: 0.8rem;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input:focus {
      border-color: #764ba2;
    }

    .info-box {
      background: #e8f4fd;
      border-left: 4px solid #3498db;
      padding: 0.8rem;
      margin-bottom: 1.5rem;
      border-radius: 0.4rem;
      color: #2c3e50;
    }

    .save-btn {
      width: 100%;
      padding: 1rem;
      background: #2ecc71;
      color: white;
      border: none;
      border-radius: 0.8rem;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class PaymentComponent {
  private debtService = inject(DebtService);
  public state = inject(DebtStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public personName = 'Cargando...';
  public paymentAmount = 0;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const person = this.state.persons().find(p => p.id === id);
      this.personName = person ? person.name : 'Persona no encontrada';
    }
  }

  async savePayment() {
    try {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id) throw new Error('No se encontró el ID de la persona');

      const amountCents = Math.round(this.paymentAmount * 100);

      await this.debtService.registerPayment(id, amountCents);
      
      this.router.navigate(['/person', id]);
    } catch (e) {
      console.error('Error procesando pago:', e);
    }
  }

  goBack() {
    const id = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/person', id || '/dashboard']);
  }
}
