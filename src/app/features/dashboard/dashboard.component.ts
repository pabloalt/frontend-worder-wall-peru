import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PedidoService } from '../../core/services/pedido.service';
import { ToastService } from '../../core/services/toast.service';
import { EstadoPedido, Pedido } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ]
})
export class DashboardComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private toast         = inject(ToastService);
  private sanitizer     = inject(DomSanitizer);

  pedidos = signal<Pedido[]>([]);
  loading = signal(true);

  total      = computed(() => this.pedidos().length);
  cotizados  = computed(() => this.pedidos().filter(p => p.estado === EstadoPedido.Cotizado).length);
  pagados    = computed(() => this.pedidos().filter(p => p.estado === EstadoPedido.Pagado).length);
  entregados = computed(() => this.pedidos().filter(p => p.estado === EstadoPedido.Entregado).length);

  readonly calendarUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    'https://calendar.google.com/calendar/embed' +
    '?src=pabloenriquealtamirano.28%40gmail.com' +
    '&ctz=America%2FLima' +
    '&mode=MONTH' +
    '&showTitle=0' +
    '&showNav=1' +
    '&showDate=1' +
    '&showPrint=0' +
    '&showTabs=0' +
    '&showCalendars=0' +
    '&showTz=0' +
    '&hl=es'
  );

  ngOnInit(): void {
    this.pedidoService.obtenerTodos().subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al cargar los pedidos.');
      }
    });
  }
}
