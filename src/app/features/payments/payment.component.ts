import { Component, inject, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DebtService } from '../../core/services/debt.service';
import { DebtStateService } from '../../core/services/debt-state.service';
import { SettingsService } from '../../core/services/settings.service';
import { formatCurrency } from '../../core/utils/format-currency';
import { PaymentResult } from '../../core/payment-engine';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Registrar Pago</h1>
        <div class="header-placeholder"></div>
      </header>

      <main class="layout">
        @if (!showReceipt()) {
          <section class="payment-card">
            <div class="payment-header">
              <div class="person-avatar">
                {{ personName().charAt(0).toUpperCase() }}
              </div>
              <div class="person-info">
                <span class="label">Abonando a</span>
                <h2 class="name">{{ personName() }}</h2>
              </div>
            </div>

            <div class="balance-summary">
              <div class="summary-item">
                <span class="summary-label">Saldo Total</span>
                <span class="summary-value">{{ formatCurrency(currentBalance()) }}</span>
              </div>
            </div>

            <form (submit)="savePayment(); $event.preventDefault()" #paymentForm="ngForm" class="payment-form">
              <div class="field">
                <label class="field-label">Monto del Abono</label>
                <div class="input-wrapper">
                  <span class="currency-prefix">$</span>
                  <input 
                    type="number" 
                    name="amount" 
                    [(ngModel)]="paymentAmount" 
                    #amountModel="ngModel" 
                    min="1" 
                    required 
                    placeholder="0"
                    class="input">
                </div>
              </div>

              <div class="info-box">
                <i class="bi bi-info-circle"></i>
                <span>El monto será distribuido automáticamente a las cuotas más antiguas primero.</span>
              </div>

              <button type="submit" [disabled]="!paymentForm.form.valid" class="btn-primary success">
                <i class="bi bi-check-circle"></i> Confirmar Pago
              </button>
            </form>
          </section>
        } @else {
          <section class="receipt-card">
            <div class="receipt-header">
              <i class="bi bi-receipt"></i>
              <h2>Comprobante de Pago</h2>
            </div>

            <div class="receipt-main">
              <div class="receipt-row">
                <span>Total Abonado:</span>
                <span class="value">{{ formatCurrency(lastPaymentCents()) }}</span>
              </div>
              
              <div class="receipt-divider"></div>
              
              <div class="receipt-section">
                <h3>Distribución del Pago</h3>
                <div class="allocations-list">
                  @for (alloc of lastResult()?.allocations; track alloc.debtItemId) {
                    <div class="allocation-item">
                      <span class="item-label">Cuota {{ alloc.debtItemId }}</span>
                      <span class="item-value">{{ formatCurrency(alloc.amountCents) }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <button (click)="finishPayment()" class="btn-primary">
              Hecho, volver al detalle
            </button>
          </section>
        }
      </main>
    </div>
  `,
  styles: [`
    .screen { min-height: 100vh; background: var(--bg-light); font-family: 'Inter', sans-serif; }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: white; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .back-btn { background: white; border: 1px solid var(--border-color); color: var(--primary-color); cursor: pointer; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 1.2rem; }
    .back-btn:hover { background: var(--bg-light); border-color: var(--primary-color); }
    .title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .header-placeholder { width: 40px; }
    .layout { padding: 2rem 1rem; max-width: 500px; margin: 0 auto; display: flex; justify-content: center; }
    .payment-card, .receipt-card { background: white; padding: 2.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); width: 100%; }
    .payment-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
    .person-avatar { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; flex-shrink: 0; }
    .person-info { display: flex; flex-direction: column; }
    .person-info .label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .person-info .name { font-size: 1.4rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .balance-summary { background: var(--bg-light); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 2rem; text-align: center; border: 1px solid var(--border-color); }
    .summary-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .summary-label { font-size: 0.8rem; color: var(--text-muted); }
    .summary-value { font-size: 1.5rem; font-weight: 700; color: var(--primary-color); }
    .payment-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    .field-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .input-wrapper { position: relative; display: flex; align-items: center; }
    .currency-prefix { position: absolute; left: 1rem; color: var(--text-muted); font-weight: 600; }
    .input { width: 100%; padding: 0.8rem 1rem 0.8rem 2rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 1.1rem; outline: none; transition: all 0.2s; background: var(--bg-light); }
    .input:focus { border-color: var(--primary-color); background: white; box-shadow: 0 0 0 3px rgba(108, 92, 131, 0.1); }
    .info-box { background: #FDFBF9; border-left: 4px solid var(--warning-color); padding: 1rem; border-radius: var(--radius-sm); color: var(--text-muted); font-size: 0.85rem; display: flex; align-items: center; gap: 10px; }
    .info-box i { color: var(--warning-color); }
    .btn-primary { width: 100%; padding: 1rem; color: white; border: none; border-radius: var(--radius-sm); font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .btn-primary.success { background: var(--success-color); }
    .btn-primary.success:hover { filter: brightness(0.9); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .receipt-header { display: flex; flex-direction: column; align-items: center; gap: 1rem; margin-bottom: 2rem; color: var(--primary-color); }
    .receipt-header i { font-size: 3rem; }
    .receipt-header h2 { margin: 0; font-size: 1.5rem; color: var(--text-main); }
    .receipt-main { margin-bottom: 2rem; }
    .receipt-row { display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700; color: var(--text-main); padding: 1rem 0; }
    .receipt-divider { height: 2px; background: var(--border-color); margin: 1rem 0; }
    .receipt-section h3 { font-size: 0.9rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 1rem; text-align: center; }
    .allocations-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .allocation-item { display: flex; justify-content: space-between; background: var(--bg-light); padding: 0.75rem 1rem; border-radius: var(--radius-sm); font-size: 0.9rem; color: var(--text-main); }
    .item-value { font-weight: 600; color: var(--success-color); }
  `]
})
export class PaymentComponent {
  private debtService = inject(DebtService);
  private settings = inject(SettingsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  public state = inject(DebtStateService);

  // Única señal de entrada: el id desde la ruta
  public personId = signal<string | null>(null);

  // Derivaciones reactivas
  public personName = computed(() => {
    const id = this.personId();
    if (!id) return 'Cargando...';
    const person = this.state.persons().find(p => p.id === id);
    return person ? person.name : 'Persona no encontrada';
  });

  public currentBalance = computed(() => {
    const id = this.personId();
    return id ? (this.state.debtByPerson()[id] || 0) : 0;
  });

  // Estado del formulario (no reactivo, solo ngModel)
  public paymentAmount = 0;
  
  // Estado de UI del receipt (sí necesita signals)
  public showReceipt = signal(false);
  public lastPaymentCents = signal(0);
  public lastResult = signal<PaymentResult | null>(null);

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        this.personId.set(params.get('id'));
      });
  }

  async savePayment() {
    try {
      const id = this.personId();
      if (!id) throw new Error('No se encontró el ID de la persona');
      const amountCents = Math.round(this.paymentAmount * 100);

      // registerPayment ahora devuelve el PaymentResult real
      const result = await this.debtService.registerPayment(id, amountCents);
      
      this.lastPaymentCents.set(amountCents);
      this.lastResult.set(result);
      this.showReceipt.set(true);
    } catch (e) {
      console.error('Error procesando pago:', e);
      alert('Hubo un error al procesar el pago.');
    }
  }

  finishPayment() {
    const id = this.personId();
    this.router.navigate(['/person', id]);
  }

  goBack() {
    const id = this.personId();
    this.router.navigate(['/person', id || '/dashboard']);
  }

  formatCurrency = (cents: number): string => {
    return formatCurrency(cents, this.settings.currency());
  };
}
