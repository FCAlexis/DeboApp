import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Signal que contiene la lista de notificaciones activas
  public notifications = signal<Notification[]>([]);

  show(message: string, type: NotificationType = 'success', duration: number = 3000) {
    const id = crypto.randomUUID();
    const notification: Notification = { id, message, type, duration };

    this.notifications.update(prev => [...prev, notification]);

    // Auto-eliminar después de la duración especificada
    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: string) {
    this.notifications.update(prev => prev.filter(n => n.id !== id));
  }

  error(message: string, duration: number = 4000) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration: number = 4000) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration: number = 4000) {
    this.show(message, 'info', duration);
  }
}
