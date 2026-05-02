import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PedidoService } from '../../core/services/pedido.service';
import { ToastService } from '../../core/services/toast.service';
import { EstadoPedido, Pedido } from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-pedidos',
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss',
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
  ]
})
export class PedidosComponent implements OnInit {
  private pedidoService = inject(PedidoService);
  private toast         = inject(ToastService);

  pedidos          = signal<Pedido[]>([]);
  loading          = signal(true);
  displayedColumns = ['cliente', 'fechaBoda', 'estado', 'detalles', 'contrato', 'acciones'];
  estados          = Object.values(EstadoPedido);

  ngOnInit(): void {
    this.cargarPedidos();
  }

  cargarPedidos(): void {
    this.loading.set(true);
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

  cambiarEstado(pedido: Pedido, nuevoEstado: EstadoPedido): void {
    this.pedidoService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.pedidos.update(list =>
          list.map(p => p.id === actualizado.id ? actualizado : p)
        );
        this.toast.success(`Estado actualizado a ${nuevoEstado}.`);
      },
      error: () => this.toast.error('Error al actualizar el estado del pedido.')
    });
  }

  contactarEmail(email: string): void {
    window.open(`mailto:${email}`, '_blank');
  }

  getEstadoColor(estado: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      [EstadoPedido.Cotizado]:  'accent',
      [EstadoPedido.Pagado]:    'primary',
      [EstadoPedido.Entregado]: '',
    };
    return map[estado] ?? '';
  }
}
