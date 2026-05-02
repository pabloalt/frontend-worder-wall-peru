import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { PedidoService } from '../../core/services/pedido.service';
import { ClienteService } from '../../core/services/cliente.service';
import { ToastService } from '../../core/services/toast.service';
import { collectFormErrors } from '../../core/utils/form-errors.util';
import { CrearPedidoRequest, Cliente } from '../../core/models';

const LABELS: Record<string, string> = {
  fechaBoda:             'Fecha de boda',
  importeTotal:          'Importe total',
  'detalles.tipoKeke':   'Tipo de keke',
  'detalles.porciones':  'Porciones',
};

@Component({
  standalone: true,
  selector: 'app-formulario',
  templateUrl: './formulario.component.html',
  styleUrl: './formulario.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSelectModule,
    MatAutocompleteModule,
  ]
})
export class FormularioComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private pedidoService  = inject(PedidoService);
  private clienteService = inject(ClienteService);
  private toast          = inject(ToastService);

  form: FormGroup;
  loading     = signal(false);
  success     = signal(false);
  contratoUrl = signal<string | null>(null);
  get minDate(): Date { return new Date(); }

  imagenesDetalle = signal<(string | null)[]>([null]);

  clientes            = signal<Cliente[]>([]);
  cargandoClientes    = signal(false);
  clienteSeleccionado = signal<Cliente | null>(null);
  busquedaCliente     = signal('');

  clientesFiltrados = computed<Cliente[]>(() => {
    const q = (this.busquedaCliente() ?? '').toLowerCase().trim();
    if (!q) return this.clientes().slice(0, 10);
    return this.clientes().filter(c =>
      c.nombres.toLowerCase().includes(q) ||
      c.apellidoPaterno.toLowerCase().includes(q) ||
      (c.apellidoMaterno?.toLowerCase().includes(q) ?? false) ||
      c.numeroDocumento.includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    ).slice(0, 10);
  });

  constructor() {
    this.form = this.fb.group({
      clienteBusqueda: [''],
      clienteId:       [null],
      nombre:     ['', [Validators.required, Validators.minLength(3)]],
      dni:        ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      celular:    [''],
      email:      ['', [Validators.email]],
      fechaBoda:  [null, Validators.required],
      detalles:   this.fb.array([this.crearDetalleGroup()]),
      importeTotal:            [null as number | null, [Validators.required, Validators.min(0.01)]],
      numeroCuotas:            [1, Validators.required],
      cuotas:                  this.fb.array([this.crearCuotaGroup()]),
      nombreLocal:             [''],
      direccion:               [''],
      ubicacionMaps:           [''],
      horaLlegada:             [''],
      horaLlegadaPorConfirmar: [true],
    });

    this.form.get('numeroCuotas')!.valueChanges.subscribe((n: number) => this.actualizarCuotas(n));
    this.form.get('clienteBusqueda')!.valueChanges.subscribe((val: any) => {
      this.busquedaCliente.set(typeof val === 'string' ? val : '');
      if (typeof val === 'string') {
        this.clienteSeleccionado.set(null);
        this.form.patchValue({ clienteId: null, nombre: '', dni: '', celular: '', email: '', fechaBoda: null });
      }
    });
  }

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.cargandoClientes.set(true);
    this.clienteService.obtenerTodos().subscribe({
      next: (data) => {
        this.clientes.set(data.sort((a, b) =>
          new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()
        ));
        this.cargandoClientes.set(false);
      },
      error: () => {
        this.cargandoClientes.set(false);
        this.toast.error('Error al cargar clientes.');
      }
    });
  }

  mostrarCliente(cliente: Cliente | null): string {
    if (!cliente) return '';
    return `${cliente.nombres} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''} - ${cliente.numeroDocumento}`.trim();
  }

  seleccionarCliente(cliente: Cliente): void {
    this.clienteSeleccionado.set(cliente);
    this.form.patchValue({
      clienteId: cliente.id,
      nombre: `${cliente.nombres} ${cliente.apellidoPaterno} ${cliente.apellidoMaterno || ''}`.trim(),
      dni: cliente.numeroDocumento,
      celular: cliente.celular || '',
      email: cliente.email || '',
      fechaBoda: new Date(cliente.fechaBoda)
    });
    if (cliente.logistica) {
      this.form.patchValue({
        nombreLocal:             cliente.logistica.nombreLocal || '',
        direccion:               cliente.logistica.direccion || '',
        ubicacionMaps:           cliente.logistica.ubicacionMaps || '',
        horaLlegada:             cliente.logistica.horaLlegada || '',
        horaLlegadaPorConfirmar: !cliente.logistica.horaLlegada
      });
    }
  }

  get detalles(): FormArray { return this.form.get('detalles') as FormArray; }
  get cuotas(): FormArray   { return this.form.get('cuotas')   as FormArray; }

  get subtotal(): number  { const t = +(this.form.get('importeTotal')?.value ?? 0); return t / 1.18; }
  get igvMonto(): number  { const t = +(this.form.get('importeTotal')?.value ?? 0); return t - t / 1.18; }
  get totalCuotas(): number { return this.cuotas.controls.reduce((s, c) => s + (+(c.get('importe')?.value ?? 0)), 0); }
  get cuotasDiff(): number  { return Math.abs(this.totalCuotas - (+(this.form.get('importeTotal')?.value ?? 0))); }

  crearCuotaGroup(): FormGroup {
    return this.fb.group({ importe: [null as number | null, Validators.min(0)], fecha: [null] });
  }

  actualizarCuotas(n: number): void {
    while (this.cuotas.length < n) this.cuotas.push(this.crearCuotaGroup());
    while (this.cuotas.length > n) this.cuotas.removeAt(this.cuotas.length - 1);
  }

  crearDetalleGroup(): FormGroup {
    return this.fb.group({
      tipoKeke:      ['', Validators.required],
      relleno:       [''],
      porciones:     [1, [Validators.required, Validators.min(1)]],
      esMaqueta:     [false],
      observaciones: [''],
    });
  }

  agregarDetalle(): void {
    this.detalles.push(this.crearDetalleGroup());
    this.imagenesDetalle.update(imgs => [...imgs, null]);
  }

  eliminarDetalle(index: number): void {
    if (this.detalles.length > 1) {
      this.detalles.removeAt(index);
      this.imagenesDetalle.update(imgs => imgs.filter((_, i) => i !== index));
    }
  }

  async seleccionarImagen(index: number, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.toast.warning('La imagen no debe superar 5 MB.');
      return;
    }
    const base64 = await this.redimensionarImagen(file, 600, 450);
    this.imagenesDetalle.update(imgs => { const c = [...imgs]; c[index] = base64; return c; });
    input.value = '';
  }

  eliminarImagen(index: number): void {
    this.imagenesDetalle.update(imgs => { const c = [...imgs]; c[index] = null; return c; });
  }

  private redimensionarImagen(file: File, maxW: number, maxH: number): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxW || height > maxH) {
            const ratio = Math.min(maxW / width, maxH / height);
            width  = Math.round(width  * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  onSubmit(): void {
    if (!this.clienteSeleccionado()) {
      this.toast.error('Debe seleccionar un cliente antes de continuar.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      collectFormErrors(this.form, LABELS).forEach(msg => this.toast.error(msg));
      return;
    }

    const val = this.form.value;
    const cliente = this.clienteSeleccionado()!

    const request: CrearPedidoRequest = {
      nombre:    `${cliente.nombres} ${cliente.apellidoPaterno}${cliente.apellidoMaterno ? ' ' + cliente.apellidoMaterno : ''}`.trim(),
      dni:       cliente.numeroDocumento,
      celular:   cliente.celular || undefined,
      email:     cliente.email || undefined,
      fechaBoda: (val.fechaBoda as Date).toISOString(),
      detalles:  val.detalles.map((d: any, i: number) => ({
        tipoKeke:          d.tipoKeke,
        relleno:           d.relleno || undefined,
        porciones:         +d.porciones,
        esMaqueta:         d.esMaqueta,
        observaciones:     d.observaciones || undefined,
        imagenReferencial: this.imagenesDetalle()[i] || undefined,
      })),
      pago: {
        importeTotal: +(val.importeTotal),
        subtotal:     +(val.importeTotal) / 1.18,
        igv:          +(val.importeTotal) - (+(val.importeTotal) / 1.18),
        numeroCuotas: +val.numeroCuotas,
        cuotas: (val.cuotas as any[]).map((c, i) => ({
          numero:  i + 1,
          importe: +(c.importe ?? 0),
          fecha:   i === 0 ? undefined : (c.fecha ? (c.fecha as Date).toISOString() : undefined),
        })),
      },
      logistica: (val.nombreLocal || val.direccion || val.horaLlegada) ? {
        nombreLocal:   val.nombreLocal || undefined,
        direccion:     val.direccion || undefined,
        ubicacionMaps: val.ubicacionMaps || undefined,
        horaLlegada:   (!val.horaLlegadaPorConfirmar && val.horaLlegada) ? val.horaLlegada : undefined,
      } : undefined
    };

    this.loading.set(true);
    this.pedidoService.crearPedido(request).subscribe({
      next: (pedido) => {
        this.loading.set(false);
        this.success.set(true);
        this.contratoUrl.set(pedido.contratoPdfUrl ?? null);
        this.toast.success('¡Pedido registrado exitosamente!');

        this.form.reset();
        this.clienteSeleccionado.set(null);
        this.busquedaCliente.set('');
        while (this.detalles.length > 1) this.detalles.removeAt(1);
        this.detalles.at(0).reset({ esMaqueta: false, porciones: 1 });
        this.imagenesDetalle.set([null]);
        this.form.patchValue({ importeTotal: null, numeroCuotas: 1, horaLlegadaPorConfirmar: true });
        this.actualizarCuotas(1);
        this.cuotas.at(0).reset();
      },
      error: (err) => {
        this.loading.set(false);
        const mensaje = err?.error?.error || err?.message || 'Error al registrar el pedido. Intente nuevamente.';
        this.toast.error(mensaje);
      }
    });
  }
}
