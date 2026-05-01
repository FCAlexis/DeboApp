import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="placeholder-screen">
      <div class="placeholder-content">
        <div class="icon-circle">
          <i class="bi bi-tools"></i>
        </div>
        <h1>Próximamente</h1>
        <p>Estamos trabajando arduamente para traerte esta funcionalidad. ¡Mantente atento!</p>
        <button class="btn-back" (click)="goBack()">Volver al Resumen</button>
      </div>
    </div>
  `,
  styles: [`
    .placeholder-screen {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-light);
      font-family: 'Inter', sans-serif;
      padding: 2rem;
    }
    .placeholder-content {
      text-align: center;
      max-width: 400px;
      background: white;
      padding: 3rem 2rem;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-md);
    }
    .icon-circle {
      width: 80px;
      height: 80px;
      background: #ede9fe;
      color: var(--primary-color);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 1.5rem;
    }
    h1 {
      font-size: 1.75rem;
      color: var(--text-main);
      margin-bottom: 1rem;
    }
    p {
      color: var(--text-muted);
      font-size: 1rem;
      line-height: 1.5;
      margin-bottom: 2rem;
    }
    .btn-back {
      padding: 0.8rem 1.5rem;
      background: var(--primary-color);
      color: white;
      border: none;
      border-radius: var(--radius-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-back:hover {
      filter: brightness(0.9);
      transform: translateY(-2px);
    }
  `]
})
export class PlaceholderComponent {
  private router = inject(Router);
  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
