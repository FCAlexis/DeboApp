import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LocalDbService, DbBackup } from '../../core/services/local-db.service';
import { DebtStateService } from '../../core/services/debt-state.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="screen">
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          <i class="bi bi-arrow-left"></i>
        </button>
        <h1 class="title">Sincronizar Datos</h1>
        <div class="header-placeholder"></div>
      </header>

      <main class="layout">
        <section class="backup-card">
          <div class="card-header">
            <div class="icon-box">
              <i class="bi bi-cloud-arrow-up"></i>
            </div>
            <h2>Respaldo de Datos</h2>
            <p>Copia tus deudas y contactos en un archivo seguro para llevarlos a otro dispositivo.</p>
          </div>

          <div class="action-group">
            <div class="action-item">
              <div class="action-info">
                <span class="action-title">Exportar Backup</span>
                <span class="action-desc">Descarga tu base de datos actual en formato .json</span>
              </div>
              <button class="btn-action primary" (click)="exportBackup()">
                <i class="bi bi-download"></i> Descargar
              </button>
            </div>

            <div class="divider"></div>

            <div class="action-item">
              <div class="action-info">
                <span class="action-title">Importar Backup</span>
                <span class="action-desc">Carga un archivo de respaldo previamente guardado</span>
              </div>
              <label class="btn-action secondary">
                <i class="bi bi-upload"></i> Subir Archivo
                <input type="file" (change)="onFileSelected($event)" style="display: none" accept=".json">
              </label>
            </div>
          </div>
        </section>

        <div class="warning-box">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div>
            <strong>Atención:</strong> Al importar un respaldo, todos los datos actuales de este dispositivo serán 
            reemplazados por la información del archivo.
          </div>
        </div>

        @if (pendingBackup()) {
          <div class="modal-overlay">
            <div class="modal-content">
              <div class="modal-header">
                <i class="bi bi-question-circle"></i>
                <h3>Confirmar Importación</h3>
              </div>
              <div class="modal-body">
                <p>Has seleccionado el respaldo: <strong>{{ fileName() }}</strong></p>
                <p>¿Estás seguro de que deseas reemplazar todos tus datos actuales?</p>
              </div>
              <div class="modal-footer">
                <button class="btn-cancel" (click)="cancelImport()">Cancelar</button>
                <button class="btn-confirm" (click)="confirmImport()">Confirmar y Cargar</button>
              </div>
            </div>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .screen { min-height: 100vh; background: var(--bg-light); font-family: 'Inter', sans-serif; }
    .header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.5rem; background: white; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; z-index: 10; }
    .back-btn { background: white; border: 1px solid var(--border-color); color: var(--primary-color); cursor: pointer; width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .title { font-size: 1.25rem; font-weight: 700; color: var(--text-main); margin: 0; }
    .header-placeholder { width: 40px; }
    .layout { padding: 2rem 1rem; max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
    .backup-card { background: white; padding: 2.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 2rem; }
    .card-header { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
    .icon-box { width: 64px; height: 64px; background: #ede9fe; color: var(--primary-color); border-radius: 20px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
    .card-header h2 { font-size: 1.4rem; color: var(--text-main); margin: 0; }
    .card-header p { font-size: 0.9rem; color: var(--text-muted); margin: 0; line-height: 1.4; }
    .action-group { display: flex; flex-direction: column; gap: 1rem; }
    .action-item { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .action-info { display: flex; flex-direction: column; gap: 2px; }
    .action-title { font-size: 0.95rem; font-weight: 600; color: var(--text-main); }
    .action-desc { font-size: 0.8rem; color: var(--text-muted); }
    .divider { height: 1px; background: var(--border-color); margin: 0.5rem 0; }
    .btn-action { padding: 0.6rem 1.2rem; border-radius: var(--radius-sm); font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; transition: all 0.2s; border: none; }
    .btn-action.primary { background: var(--primary-color); color: white; }
    .btn-action.secondary { background: white; border: 1px solid var(--border-color); color: var(--text-main); }
    .btn-action:hover { filter: brightness(0.9); transform: translateY(-1px); }
    .warning-box { background: #fff5f5; border-left: 4px solid var(--danger-color); padding: 1rem; border-radius: var(--radius-sm); color: var(--text-main); font-size: 0.85rem; display: flex; align-items: center; gap: 12px; border: 1px solid #ffe3e3; }
    .warning-box i { color: var(--danger-color); font-size: 1.2rem; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(2px); }
    .modal-content { background: white; padding: 2rem; border-radius: var(--radius-lg); max-width: 400px; width: 90%; text-align: center; box-shadow: var(--shadow-lg); animation: slideIn 0.3s ease-out; }
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-header { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
    .modal-header i { font-size: 2.5rem; color: var(--warning-color); }
    .modal-header h3 { margin: 0; color: var(--text-main); }
    .modal-body { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 2rem; line-height: 1.5; }
    .modal-footer { display: flex; gap: 1rem; justify-content: center; }
    .btn-cancel { padding: 0.8rem 1.5rem; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; color: var(--text-muted); }
    .btn-confirm { padding: 0.8rem 1.5rem; background: var(--danger-color); color: white; border: none; border-radius: var(--radius-sm); cursor: pointer; font-weight: 600; }
    @media (max-width: 600px) {
      .action-item { flex-direction: column; align-items: flex-start; }
      .back-btn { min-width: 44px; min-height: 44px; }
    }
  `]
})
export class BackupComponent {
  private dbService = inject(LocalDbService);
  private state = inject(DebtStateService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  public pendingBackup = signal<DbBackup | null>(null);
  public fileName = signal<string>('');

  async exportBackup() {
    try {
      const backup = await this.dbService.exportData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `deboapp_backup_${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.notify.show('Respaldo exportado con éxito');
    } catch (e) {
      this.notify.error('Error al exportar datos');
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    this.fileName.set(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backup: DbBackup = JSON.parse(content);
        this.pendingBackup.set(backup);
      } catch (err) {
        this.notify.error('El archivo seleccionado no es un backup válido.');
      }
    };
    reader.readAsText(file);
  }

  cancelImport() {
    this.pendingBackup.set(null);
    this.fileName.set('');
  }

  async confirmImport() {
    const backup = this.pendingBackup();
    if (!backup) return;
    try {
      await this.dbService.importData(backup);
      // We assume the state update is handled internally or by reloading the page/state
      this.notify.show('Datos importados con éxito');
      this.cancelImport();
      this.router.navigate(['/dashboard']);
    } catch (e) {
      this.notify.error('Error al importar datos');
    }
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
