import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DebtService } from '../../core/services/debt.service';
import { DebtStateService } from '../../core/services/debt-state.service';

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Registrar Compra</h1>
        <div class="header-placeholder"></div>
      </header>

      <main class="layout">
        <section class="form-card">
          <h2 class="form-title">Detalles de la Compra</h2>
          <form (submit)="savePurchase()" #purchaseForm="ngForm">
            
            <div class="field">
              <label class="field-label">Persona / Tarjeta</label>
              <select 
                name="personId" 
                [(ngModel)]="purchase.personId" 
                #personModel="ngModel" 
                required 
                class="input">
                <option value="" disabled>Seleccione una persona</option>
                @for (person of state.persons(); track person.id) {
                  <option [value]="person.id">{{ person.name }}</option>
                }
              </select>
            </div>

            <div class="field">
              <label class="field-label">Descripción</label>
              <input 
                name="description" 
                [(ngModel)]="purchase.description" 
                #descModel="ngModel" 
                required 
                placeholder="Ej. Tenis Nike, Supermercado..."
                class="input">
            </div>

            <div class="row">
              <div class="field">
                <label class="field-label">Monto Total</label>
                <input 
                  type="number" 
                  name="totalCents" 
                  [(ngModel)]="purchase.totalCents" 
                  #amountModel="ngModel" 
                  min="1" 
                  required 
                  placeholder="0"
                  class="input">
              </div>
              <div class="field">
                <label class="field-label">Cuotas</label>
                <input 
                  type="number" 
                  name="installmentCount" 
                  [(ngModel)]="purchase.installmentCount" 
                  #countModel="ngModel" 
                  min="1" 
                  required 
                  placeholder="1"
                  class="input">
              </div>
            </div>

            <div class="info-box">
              <i class="bi bi-info-circle"></i>
              <span>Los montos se ingresan en valor nominal. El sistema convertirá automáticamente a centavos para asegurar precisión financiera.</span>
            </div>

            <button type="submit" [disabled]="!purchaseForm.form.valid" class="btn-primary">
              <i class="bi bi-cloud-arrow-up"></i> Generar Cuotas y Guardar
            </button>
          </form>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .screen {
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
      padding: 2rem 1rem;
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      justify-content: center;
      align-items: start;
    }

    .form-card {
      background: white;
      padding: 2.5rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      width: 100%;
      max-width: 550px;
    }

    .form-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text-main);
      margin: 0 0 2rem 0;
      text-align: center;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .field-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input {
      padding: 0.75rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      font-size: 1rem;
      outline: none;
      transition: all 0.2s;
      background: var(--bg-light);
    }

    .input:focus {
      border-color: var(--primary-color);
      background: white;
      box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .info-box {
      background: #FDFBF9;
      border: 1px solid var(--border-color);
      border-left: 4px solid var(--warning-color);
      padding: 1rem;
      margin-bottom: 2rem;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .info-box i {
      color: var(--warning-color);
      font-size: 1.1rem;
    }

    .btn-primary {
      width: 100%;
      padding: 1rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .btn-primary:hover {
      background: var(--primary-dark);
      transform: translateY(-2px);
      box-shadow: var(--shadow-sm);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    @media (max-width: 600px) {
      .row {
        grid-template-columns: 1fr;
      }
      .back-btn {
        min-width: 44px;
        min-height: 44px;
      }
    }
  `]
})
export class PurchaseComponent implements OnInit {
  private debtService = inject(DebtService);
  public state = inject(DebtStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  public purchase = {
    personId: '',
    description: '',
    totalCents: 0,
    installmentCount: 1
  };

  ngOnInit() {
    const personId = this.route.snapshot.queryParams['personId'];
    if (personId) {
      this.purchase.personId = personId;
    }
  }

  async savePurchase() {
    try {
      const totalCents = Math.round(this.purchase.totalCents * 100);

      await this.debtService.addPurchase(
        this.purchase.personId,
        this.purchase.description,
        totalCents,
        this.purchase.installmentCount
      );
      
      this.router.navigate(['/dashboard']);
    } catch (e) {
      console.error('Error registrando compra:', e);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
