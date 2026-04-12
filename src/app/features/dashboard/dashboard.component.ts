import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PedidoService } from '../../core/services/pedido.service';
import { EstadoPedido, Pedido } from '../../core/models';

export interface DiaCalendario {
  fecha: Date;
  esDelMes: boolean;
  esHoy: boolean;
  pedidos: Pedido[];
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule,
    MatTooltipModule,
  ]
})
export class DashboardComponent implements OnInit {
  pedidos = signal<Pedido[]>([]);
  loading = signal(true);
  mesActual = signal(new Date());
  diaSeleccionado = signal<DiaCalendario | null>(null);

  // Stats
  total         = computed(() => this.pedidos().length);
  cotizados     = computed(() => this.pedidos().filter(p => p.estado === EstadoPedido.Cotizado).length);
  pagados       = computed(() => this.pedidos().filter(p => p.estado === EstadoPedido.Pagado).length);
  entregados    = computed(() => this.pedidos().filter(p => p.estado === EstadoPedido.Entregado).length);

  readonly diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Mapa fecha ISO → pedidos
  private pedidosPorFecha = computed(() => {
    const mapa = new Map<string, Pedido[]>();
    for (const p of this.pedidos()) {
      const key = p.fechaBoda.substring(0, 10);
      const lista = mapa.get(key) ?? [];
      lista.push(p);
      mapa.set(key, lista);
    }
    return mapa;
  });

  // Grilla del mes actual (42 celdas)
  diasCalendario = computed<DiaCalendario[]>(() => {
    const hoy    = new Date();
    const mes    = this.mesActual();
    const inicio = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const fin    = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    const dias: DiaCalendario[] = [];

    // Días del mes anterior para completar la primera semana
    for (let i = inicio.getDay(); i > 0; i--) {
      const fecha = new Date(inicio);
      fecha.setDate(fecha.getDate() - i);
      dias.push(this.crearDia(fecha, false, hoy));
    }
    // Días del mes
    for (let d = 1; d <= fin.getDate(); d++) {
      dias.push(this.crearDia(new Date(mes.getFullYear(), mes.getMonth(), d), true, hoy));
    }
    // Días del mes siguiente para completar hasta 42
    let extra = 1;
    while (dias.length < 42) {
      const fecha = new Date(fin);
      fecha.setDate(fecha.getDate() + extra++);
      dias.push(this.crearDia(fecha, false, hoy));
    }
    return dias;
  });

  private crearDia(fecha: Date, esDelMes: boolean, hoy: Date): DiaCalendario {
    const key = fecha.toISOString().substring(0, 10);
    return {
      fecha,
      esDelMes,
      esHoy: fecha.toDateString() === hoy.toDateString(),
      pedidos: this.pedidosPorFecha().get(key) ?? [],
    };
  }

  mesLabel = computed(() => {
    return this.mesActual().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  });

  mesPrevio(): void {
    const m = new Date(this.mesActual());
    m.setMonth(m.getMonth() - 1);
    this.mesActual.set(m);
    this.diaSeleccionado.set(null);
  }

  mesSiguiente(): void {
    const m = new Date(this.mesActual());
    m.setMonth(m.getMonth() + 1);
    this.mesActual.set(m);
    this.diaSeleccionado.set(null);
  }

  seleccionarDia(dia: DiaCalendario): void {
    if (dia.pedidos.length === 0) {
      this.diaSeleccionado.set(null);
      return;
    }
    this.diaSeleccionado.set(
      this.diaSeleccionado()?.fecha.toDateString() === dia.fecha.toDateString() ? null : dia
    );
  }

  constructor(private pedidoService: PedidoService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.pedidoService.obtenerTodos().subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar los pedidos', '✗', { duration: 4000 });
      }
    });
  }

  getEstadoColor(estado: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      [EstadoPedido.Cotizado]:  'accent',
      [EstadoPedido.Pagado]:    'primary',
      [EstadoPedido.Entregado]: '',
    };
    return map[estado] ?? '';
  }

  formatearFecha(fecha: Date): string {
    return fecha.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  getEstadoBg(estado: EstadoPedido): string {
    const map: Record<EstadoPedido, string> = {
      [EstadoPedido.Cotizado]:  '#ff9800',
      [EstadoPedido.Pagado]:    '#3E6F57',
      [EstadoPedido.Entregado]: '#9e9e9e',
    };
    return map[estado] ?? '#999';
  }
}
