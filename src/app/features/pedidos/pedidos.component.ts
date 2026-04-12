import { Component, OnInit, signal } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PedidoService } from '../../core/services/pedido.service';
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
    MatSnackBarModule,
  ]
})
export class PedidosComponent implements OnInit {
  pedidos = signal<Pedido[]>([]);
  loading = signal(true);
  displayedColumns = ['cliente', 'fechaBoda', 'estado', 'detalles', 'contrato', 'acciones'];
  estados = Object.values(EstadoPedido);

  constructor(
    private pedidoService: PedidoService,
    private snackBar: MatSnackBar
  ) {}

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
      error: () => this.loading.set(false)
    });
  }

  cambiarEstado(pedido: Pedido, nuevoEstado: EstadoPedido): void {
    this.pedidoService.actualizarEstado(pedido.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.pedidos.update(list =>
          list.map(p => p.id === actualizado.id ? actualizado : p)
        );
        this.snackBar.open(`Estado actualizado a ${nuevoEstado}`, '✓', { duration: 3000 });
      },
      error: () => this.snackBar.open('Error al actualizar estado', '✗', { duration: 3000 })
    });
  }

  contactarEmail(email: string): void {
    window.open(`mailto:${email}`, '_blank');
  }

  getEstadoColor(estado: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      [EstadoPedido.Cotizado]: 'accent',
      [EstadoPedido.Pagado]:   'primary',
      [EstadoPedido.Entregado]: '',
    };
    return map[estado] ?? '';
  }
}
