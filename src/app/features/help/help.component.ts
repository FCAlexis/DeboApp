import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [],
  template: `
    <div class="screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Ayuda</h1>
        <div class="header-placeholder"></div>
      </header>

      <main class="layout">
        <!-- Cómo funciona -->
        <section class="card">
          <h2>📋 Cómo funciona</h2>
          <ol class="steps">
            <li><strong>Creá una persona</strong> — Juan, María, etc.</li>
            <li><strong>Registrale una compra</strong> — con cantidad de cuotas y monto</li>
            <li><strong>Las cuotas se generan automáticamente</strong> — según el día de cierre y vencimiento de la persona</li>
            <li><strong>Registrá pagos</strong> — el engine los distribuye entre las cuotas impagas</li>
            <li><strong>El dashboard te muestra el resumen</strong> — salud de deuda, alertas, charts</li>
          </ol>
        </section>

        <!-- Ciclo de tarjeta -->
        <section class="card">
          <h2>🔄 Ciclo de tarjeta</h2>
          <p>Cada persona tiene dos parámetros:</p>
          <div class="param-grid">
            <div class="param">
              <span class="param-label">Día de cierre</span>
              <span class="param-desc">Cuándo cierra el período. Las compras después de esta fecha pasan al próximo período.</span>
            </div>
            <div class="param">
              <span class="param-label">Día de vencimiento</span>
              <span class="param-desc">Cuándo vence el pago. Si es antes del cierre, vence el mismo mes; si no, al mes siguiente.</span>
            </div>
          </div>
          <p class="example"><strong>Ejemplo:</strong> Cierre 15, Vencimiento 5 → Compra del 10 vence el 5 del próximo mes. Compra del 20 vence el 5 del próximo mes también (ya pasó el cierre).</p>
        </section>

        <!-- Distribución de pagos -->
        <section class="card">
          <h2>💸 Distribución de pagos</h2>
          <p>Cuando registrás un pago, el engine lo distribuye así:</p>
          <ol class="priority">
            <li><span class="tag danger">Vencidas primero</span> — las cuotas vencidas tienen prioridad absoluta</li>
            <li><span class="tag warn">Más antiguas</span> — entre las vencidas, paga primero la más vieja</li>
            <li><span class="tag info">Próximas a vencer</span> — si sobra, paga cuotas que vencen hoy o en los próximos 3 días</li>
            <li><span class="tag safe">Futuras</span> — el resto se aplica a cuotas futuras en orden cronológico</li>
          </ol>
        </section>

        <!-- FAQ -->
        <section class="card">
          <h2>❓ Preguntas frecuentes</h2>

          <details>
            <summary>¿Qué significa "EN RIESGO"?</summary>
            <p>Significa que tenés cuotas vencidas o que vencen hoy. El dashboard te marca alertas cuando esto pasa.</p>
          </details>

          <details>
            <summary>¿Cómo se calcula la tasa de recuperación?</summary>
            <p>Es el porcentaje de la deuda total que ya fue pagada. Se calcula como: <code>(total pagado / total adeudado) × 100</code>.</p>
          </details>

          <details>
            <summary>¿Puedo pagar antes del vencimiento?</summary>
            <p>Sí. Cuando registrás un pago, se distribuye primero a las cuotas vencidas. Si no hay vencidas, se aplica a las próximas.</p>
          </details>

          <details>
            <summary>¿Qué pasa si borro una persona?</summary>
            <p>Se eliminan todos sus datos: compras, cuotas y pagos asociados. Esta acción no se puede deshacer.</p>
          </details>

          <details>
            <summary>¿Los datos se sincronizan con la nube?</summary>
            <p>No. Todo se almacena localmente en el navegador (IndexedDB). Podés exportar tus datos desde Ajustes o Respaldo.</p>
          </details>
        </section>

        <!-- Badges reference -->
        <section class="card">
          <h2>🏷️ Referencia de estados</h2>
          <div class="badge-grid">
            <div class="badge-row">
              <span class="badge safe">SANA</span>
              <span>Sin cuotas vencidas ni próximas a vencer</span>
            </div>
            <div class="badge-row">
              <span class="badge warn">EN RIESGO</span>
              <span>Hay cuotas vencidas o que vencen hoy</span>
            </div>
            <div class="badge-row">
              <span class="badge danger">CRÍTICA</span>
              <span>Más de 5 cuotas vencidas</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .screen { min-height: 100vh; background: var(--bg-light); font-family: 'Inter', sans-serif; }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: white; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .back-btn { background: white; border: 1px solid var(--border-color); cursor: pointer; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .back-btn:hover { filter: brightness(0.9); transform: translateY(-1px); }
    .title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .header-placeholder { width: 40px; }
    .layout { padding: 2rem 1rem; max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; padding-bottom: 4rem; }

    .card { background: white; padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); }
    .card h2 { font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin: 0 0 1rem; }

    .steps, .priority { margin: 0; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .steps li, .priority li { font-size: 0.9rem; color: var(--text-main); line-height: 1.5; }

    .param-grid { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.75rem; }
    .param { display: flex; flex-direction: column; gap: 0.2rem; }
    .param-label { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
    .param-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }
    .example { font-size: 0.85rem; color: var(--text-muted); background: var(--bg-light); padding: 0.75rem 1rem; border-radius: var(--radius-sm); margin: 0; }

    .tag { display: inline-block; padding: 0.1rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
    .tag.danger { background: #fecaca; color: #dc2626; }
    .tag.warn { background: #fde68a; color: #d97706; }
    .tag.info { background: #bfdbfe; color: #2563eb; }
    .tag.safe { background: #bbf7d0; color: #16a34a; }

    details { border-top: 1px solid var(--border-color); padding: 0.75rem 0; }
    details:first-of-type { border-top: none; }
    summary { font-weight: 600; font-size: 0.9rem; cursor: pointer; color: var(--text-main); padding: 0.25rem 0; }
    details p { font-size: 0.85rem; color: var(--text-muted); margin: 0.5rem 0 0; line-height: 1.5; }
    details code { background: var(--bg-light); padding: 0.1rem 0.3rem; border-radius: 3px; font-size: 0.8rem; }

    .badge-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .badge-row { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; color: var(--text-main); }
    .badge { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; min-width: 80px; text-align: center; }
    .badge.safe { background: #bbf7d0; color: #16a34a; }
    .badge.warn { background: #fde68a; color: #d97706; }
    .badge.danger { background: #fecaca; color: #dc2626; }

    @media (max-width: 600px) {
      .layout { padding: 1rem 0.75rem; }
      .card { padding: 1.25rem; }
    }
  `],
})
export class HelpComponent {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}