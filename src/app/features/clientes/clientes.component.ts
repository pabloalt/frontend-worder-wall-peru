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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ClienteService } from '../../core/services/cliente.service';
import { Cliente } from '../../core/models';
import { EditarClienteDialogComponent } from './editar-cliente-dialog.component';

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
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ]
})
export class ClientesComponent implements OnInit {
  loading = signal(true);
  busqueda = signal('');

  private clientes = signal<Cliente[]>([]);

  clientesFiltrados = computed<Cliente[]>(() => {
    const q = this.busqueda().toLowerCase().trim();
    if (!q) return this.clientes();
    return this.clientes().filter(c =>
      c.nombres.toLowerCase().includes(q) ||
      c.apellidoPaterno.toLowerCase().includes(q) ||
      (c.apellidoMaterno?.toLowerCase().includes(q) ?? false) ||
      c.numeroDocumento.includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.celular?.includes(q) ?? false)
    );
  });

  total = computed(() => this.clientes().length);

  mostrarEnlace   = signal(false);
  generandoEnlace = signal(false);
  enlaceConToken  = signal<string | null>(null);

  private readonly baseRegistro = inject(DOCUMENT).location.origin + '/registro-cliente';

  displayedColumns = ['cliente', 'contacto', 'fechaBoda', 'acciones'];

  constructor(
    private clienteService: ClienteService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.loading.set(true);
    this.clienteService.obtenerTodos().subscribe({
      next: (data) => {
        this.clientes.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al cargar los clientes', '✗', { duration: 4000 });
      }
    });
  }

  editarCliente(cliente: Cliente): void {
    const ref = this.dialog.open(EditarClienteDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: cliente,
    });

    ref.afterClosed().subscribe((actualizado: Cliente | undefined) => {
      if (!actualizado) return;
      this.clientes.update(lista =>
        lista.map(c => c.id === actualizado.id ? actualizado : c)
      );
      this.snackBar.open('Cliente actualizado correctamente', '✓', { duration: 3000 });
    });
  }

  toggleEnlace(): void {
    if (this.mostrarEnlace()) {
      this.mostrarEnlace.set(false);
      this.enlaceConToken.set(null);
      return;
    }
    this.mostrarEnlace.set(true);
    this.generandoEnlace.set(true);
    this.clienteService.generarToken().subscribe({
      next: ({ token }) => {
        this.enlaceConToken.set(`${this.baseRegistro}?token=${token}`);
        this.generandoEnlace.set(false);
      },
      error: () => {
        this.generandoEnlace.set(false);
        this.mostrarEnlace.set(false);
        this.snackBar.open('No se pudo generar el enlace', '✗', { duration: 3000 });
      }
    });
  }

  copiarEnlace(): void {
    const url = this.enlaceConToken();
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => this.snackBar.open('¡Enlace copiado al portapapeles!', '✓', { duration: 3000 }))
      .catch(() => this.snackBar.open('No se pudo copiar el enlace', '✗', { duration: 3000 }));
  }

  abrirEnlace(): void {
    const url = this.enlaceConToken();
    if (url) window.open(url, '_blank');
  }

  compartirWhatsApp(): void {
    const url = this.enlaceConToken();
    if (!url) return;
    const mensaje = encodeURIComponent(`Registrá tus datos aquí: ${url}`);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  }

  contactarEmail(email: string): void {
    window.open(`mailto:${email}`, '_blank');
  }

  contactarWhatsApp(celular: string): void {
    const numero = celular.replace(/\D/g, '');
    window.open(`https://wa.me/51${numero}`, '_blank');
  }

  nombreCompleto(c: Cliente): string {
    return [c.nombres, c.apellidoPaterno, c.apellidoMaterno].filter(Boolean).join(' ');
  }
}
