import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'warning' | 'success';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  error(message: string, duration = 5000): void   { this.show(message, 'error', duration); }
  warning(message: string, duration = 5000): void  { this.show(message, 'warning', duration); }
  success(message: string, duration = 4000): void  { this.show(message, 'success', duration); }

  dismiss(id: number): void {
    this._toasts.update(ts => ts.filter(t => t.id !== id));
  }

  private show(message: string, type: ToastType, duration: number): void {
    const id = this.nextId++;
    this._toasts.update(ts => [...ts, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
