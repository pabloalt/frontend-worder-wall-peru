import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToastService } from '../../core/services/toast.service';

@Component({
  standalone: true,
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  imports: [CommonModule, MatIconModule, MatButtonModule],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  iconFor(type: string): string {
    return type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'check_circle';
  }
}
