import { Component, signal } from '@angular/core';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { PedidoService } from '../../core/services/pedido.service';
import { CrearPedidoRequest } from '../../core/models';

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
    MatSnackBarModule,
    MatDividerModule,
    MatSelectModule,
  ]
})
export class FormularioComponent {
  form: FormGroup;
  loading = signal(false);
  success = signal(false);
  contratoUrl = signal<string | null>(null);
  minDate = new Date();

  /** Base64 comprimida por índice de detalle */
  imagenesDetalle = signal<(string | null)[]>([null]);

  constructor(
    private fb: FormBuilder,
    private pedidoService: PedidoService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      // Cliente
      nombre:     ['', [Validators.required, Validators.minLength(3)]],
      dni:        ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      celular:    [''],
      email:      ['', [Validators.email]],
      fechaBoda:  [null, Validators.required],
      // Detalles (al menos 1)
      detalles: this.fb.array([this.crearDetalleGroup()]),
      // Importe y pago
      importeTotal:  [null as number | null, Validators.min(0)],
      numeroCuotas:  [1, Validators.required],
      cuotas:        this.fb.array([this.crearCuotaGroup()]),
      // Logística
      nombreLocal:    [''],
      direccion:      [''],
      ubicacionMaps:  [''],
      horaLlegada:              [''],
      horaLlegadaPorConfirmar:  [true],
    });

    this.form.get('numeroCuotas')!.valueChanges.subscribe((n: number) => this.actualizarCuotas(n));
  }

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  get cuotas(): FormArray {
    return this.form.get('cuotas') as FormArray;
  }

  get subtotal(): number {
    const t = +(this.form.get('importeTotal')?.value ?? 0);
    return t / 1.18;
  }

  get igvMonto(): number {
    const t = +(this.form.get('importeTotal')?.value ?? 0);
    return t - t / 1.18;
  }

  get totalCuotas(): number {
    return this.cuotas.controls.reduce((s, c) => s + (+(c.get('importe')?.value ?? 0)), 0);
  }

  get cuotasDiff(): number {
    return Math.abs(this.totalCuotas - (+(this.form.get('importeTotal')?.value ?? 0)));
  }

  crearCuotaGroup(): FormGroup {
    return this.fb.group({
      importe: [null as number | null, Validators.min(0)],
      fecha:   [null],
    });
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
      this.snackBar.open('La imagen no debe superar 5 MB', '✗', { duration: 3000 });
      return;
    }
    const base64 = await this.redimensionarImagen(file, 600, 450);
    this.imagenesDetalle.update(imgs => {
      const copia = [...imgs];
      copia[index] = base64;
      return copia;
    });
    input.value = '';
  }

  eliminarImagen(index: number): void {
    this.imagenesDetalle.update(imgs => {
      const copia = [...imgs];
      copia[index] = null;
      return copia;
    });
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
          canvas.width  = width;
          canvas.height = height;
          canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.75));
        };
        img.src = e.target!.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.value;
    const request: CrearPedidoRequest = {
      nombre:    val.nombre,
      dni:       val.dni,
      celular:   val.celular || undefined,
      email:     val.email || undefined,
      fechaBoda: (val.fechaBoda as Date).toISOString(),
      detalles:  val.detalles.map((d: any, i: number) => ({
        ...d,
        imagenReferencial: this.imagenesDetalle()[i] ?? undefined,
      })),
      pago: (+(val.importeTotal ?? 0)) > 0 ? {
        importeTotal: +(val.importeTotal),
        subtotal:     +(val.importeTotal) / 1.18,
        igv:          +(val.importeTotal) - +(val.importeTotal) / 1.18,
        numeroCuotas: val.numeroCuotas,
        cuotas: (val.cuotas as any[]).map((c, i) => ({
          numero:  i + 1,
          importe: +(c.importe ?? 0),
          fecha:   i === 0 ? undefined : (c.fecha ? (c.fecha as Date).toISOString() : undefined),
        })),
      } : undefined,
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
        this.snackBar.open('¡Pedido registrado! Te enviaremos el contrato por correo.', '✓', { duration: 6000 });
        this.form.reset();
        while (this.detalles.length > 1) this.detalles.removeAt(1);
        this.detalles.at(0).reset({ esMaqueta: false, porciones: 1 });
        this.imagenesDetalle.set([null]);
        this.form.get('importeTotal')?.reset(null);
        this.form.get('numeroCuotas')?.setValue(1, { emitEvent: false });
        this.actualizarCuotas(1);
        this.cuotas.at(0).reset();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error al registrar el pedido. Intente nuevamente.', '✗', { duration: 4000 });
      }
    });
  }
}
