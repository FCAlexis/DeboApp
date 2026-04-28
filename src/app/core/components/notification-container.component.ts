import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container">
      @for (note of notifications(); track note.id) {
        <div class="notification" [class]="'type-' + note.type" (click)="remove(note.id)">
          <div class="content">
            <i class="bi" [class]="getIcon(note.type)"></i>
            <span>{{ note.message }}</span>
          </div>
          <button class="close-btn">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .notification {
      pointer-events: auto;
      min-width: 300px;
      max-width: 400px;
      background: white;
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid transparent;
      cursor: pointer;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .content {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-main);
      font-size: 0.9rem;
      font-weight: 500;
    }
    .content i {
      font-size: 1.2rem;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--text-muted);
      cursor: pointer;
      line-height: 1;
      padding: 0;
    }
    /* Types */
    .type-success { border-left-color: var(--success-color); }
    .type-success i { color: var(--success-color); }
    .type-error { border-left-color: var(--danger-color); }
    .type-error i { color: var(--danger-color); }
    .type-warning { border-left-color: var(--warning-color); }
    .type-warning i { color: var(--warning-color); }
    .type-info { border-left-color: var(--primary-color); }
    .type-info i { color: var(--primary-color); }
  `]
})
export class NotificationContainerComponent {
  private notifyService = inject(NotificationService);
  public notifications = this.notifyService.notifications;

  remove(id: string) {
    this.notifyService.remove(id);
  }

  getIcon(type: string): string {
    switch(type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-x-circle-fill';
      case 'warning': return 'bi-exclamation-triangle-fill';
      default: return 'bi-info-circle-fill';
    }
  }
}
