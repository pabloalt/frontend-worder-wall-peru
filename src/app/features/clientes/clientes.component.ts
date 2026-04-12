import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { PedidoService } from '../../core/services/pedido.service';
import { EstadoPedido, Pedido } from '../../core/models';

export interface FilaCliente {
  nombreCliente: string;
  dni: string;
  celular?: string;
  email?: string;
  creadoEn: string;
  pedidos: Pedido[];
  ultimoPedido: Pedido;
}

@Component({
  standalone: true,
  selector: 'app-clientes',
  templateUrl: 'clientes.component.html',
  styleUrl: 'clientes.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatBadgeModule,
  ]
})
export class ClientesComponent implements OnInit {
  loading = signal(true);
  busqueda = signal('');

  private todosLosPedidos = signal<Pedido[]>([]);

  /** Agrupa pedidos por DNI y construye una fila por cliente */
  private filas = computed<FilaCliente[]>(() => {
    const mapa = new Map<string, Pedido[]>();
    for (const p of this.todosLosPedidos()) {
      const grupo = mapa.get(p.dni) ?? [];
      grupo.push(p);
      mapa.set(p.dni, grupo);
    }

    return Array.from(mapa.values()).map(pedidos => {
      const ordenados = [...pedidos].sort(
        (a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
      );
      const ultimo = ordenados[0];
      return {
        nombreCliente: ultimo.nombreCliente,
        dni:           ultimo.dni,
        celular:       ultimo.celular,
        email:         ultimo.email,
        creadoEn:      ordenados[ordenados.length - 1].creadoEn, // fecha del primer pedido
        pedidos:       ordenados,
        ultimoPedido:  ultimo,
      };
    }).sort((a, b) => a.nombreCliente.localeCompare(b.nombreCliente));
  });

  /** Filas filtradas por el buscador */
  clientesFiltrados = computed<FilaCliente[]>(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.filas();
    return this.filas().filter(c =>
      c.nombreCliente.toLowerCase().includes(q) ||
      c.dni.includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.celular?.includes(q) ?? false)
    );
  });

  total         = computed(() => this.filas().length);
  conContrato   = computed(() => this.filas().filter(c => c.ultimoPedido.contratoPdfUrl).length);
  sinContrato   = computed(() => this.total() - this.conContrato());

  mostrarEnlace = signal(false);
  readonly enlaceRegistro = inject(DOCUMENT).location.origin + '/registro-cliente';

  displayedColumns = ['cliente', 'contacto', 'pedidos', 'ultimaBoda', 'estado', 'contrato'];

  constructor(
    private pedidoService: PedidoService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.pedidoService.obtenerTodos().subscribe({
      next: (data) => {
        this.todosLosPedidos.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar los clientes', '✗', { duration: 4000 });
      }
    });
  }

  toggleEnlace(): void {
    this.mostrarEnlace.update(v => !v);
  }

  copiarEnlace(): void {
    navigator.clipboard.writeText(this.enlaceRegistro).then(() => {
      this.snackBar.open('¡Enlace copiado al portapapeles!', '✓', { duration: 3000 });
    });
  }

  abrirEnlace(): void {
    window.open(this.enlaceRegistro, '_blank');
  }

  compartirWhatsApp(): void {
    const mensaje = encodeURIComponent(`Registrá tu pedido aquí: ${this.enlaceRegistro}`);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  }

  verContrato(url: string): void {
    window.open(url, '_blank');
  }

  imprimirContrato(url: string): void {
    const ventana = window.open(url, '_blank');
    if (ventana) {
      ventana.addEventListener('load', () => ventana.print());
    }
  }

  contactarEmail(email: string): void {
    window.open(`mailto:${email}`, '_blank');
  }

  contactarWhatsApp(celular: string): void {
    const numero = celular.replace(/\D/g, '');
    window.open(`https://wa.me/51${numero}`, '_blank');
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
