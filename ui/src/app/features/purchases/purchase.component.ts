import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DebtService } from '../../core/debt.service';
import { DebtStateService, Person } from '../../core/debt-state.service';

@Component({
// ...

@Component({
  selector: 'app-purchase',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="purchase-container">
      <header class="header">
        <button class="back-btn" (click)="goBack()">← Volver</button>
        <h1>Registrar Compra</h1>
      </header>

      <section class="form-card">
        <form (submit)="savePurchase()" #purchaseForm="ngForm">
          
          <div class="input-group">
            <label>Persona / Tarjeta</label>
            <select name="personId" [(ngModel)]="purchase.personId" #personModel="ngModel" required class="form-input">
              <option value="" disabled>Seleccione una persona</option>
              @for (person of state.persons(); track person.id) {
                <option [value]="person.id">{{ person.name }}</option>
              }
            </select>
          </div>

          <div class="input-group">
            <label>Descripción</label>
            <input 
              name="description" 
              [(ngModel)]="purchase.description" 
              #descModel="ngModel" 
              required 
              placeholder="Ej. Tenis Nike, Supermercado..."
              class="form-input">
          </div>

          <div class="row">
            <div class="input-group">
              <label>Monto Total</label>
              <input 
                type="number" 
                name="totalCents" 
                [(ngModel)]="purchase.totalCents" 
                #amountModel="ngModel" 
                min="1" 
                required 
                placeholder="0"
                class="form-input">
            </div>
            <div class="input-group">
              <label>Cuotas</label>
              <input 
                type="number" 
                name="installmentCount" 
                [(ngModel)]="purchase.installmentCount" 
                #countModel="ngModel" 
                min="1" 
                required 
                placeholder="1"
                class="form-input">
            </div>
          </div>

          <div class="info-box">
            <small>⚠️ Los montos se ingresan en valor nominal. El sistema convertirá automáticamente a centavos para asegurar precisión financiera.</small>
          </div>

          <button type="submit" [disabled]="!purchaseForm.form.valid" class="save-btn">
            Generar Cuotas y Guardar
          </button>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .purchase-container {
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

    .header h1 {
      font-size: clamp(1.5rem, 5vw, 2.5rem);
      color: #333;
      margin: 0;
    }

    .form-card {
      background: white;
      padding: 1.5rem;
      border-radius: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      max-width: 600px;
      margin: 0 auto;
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

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .info-box {
      background: #fffbe6;
      border-left: 4px solid #ffe58f;
      padding: 0.8rem;
      margin-bottom: 1.5rem;
      border-radius: 0.4rem;
      color: #856404;
    }

    .save-btn {
      width: 100%;
      padding: 1rem;
      background: #764ba2;
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
    // Si venimos desde el detalle de la persona, pre-seleccionamos la persona
    const personId = this.route.snapshot.queryParams['personId'];
    if (personId) {
      this.purchase.personId = personId;
    }
  }

  async savePurchase() {
// ...
    try {
      // Convertimos el monto ingresado (ej: 1500.50) a centavos (150050)
      // multiplicamos por 100 y redondeamos para evitar floats
      const totalCents = Math.round(this.purchase.totalCents * 100);

      await this.debtService.addPurchase(
        this.purchase.personId,
        this.purchase.description,
        totalCents,
        this.purchase.installmentCount
      );
      
      // Redirigimos al dashboard para ver la deuda actualizada
      this.router.navigate(['/dashboard']);
    } catch (e) {
      console.error('Error registrando compra:', e);
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
