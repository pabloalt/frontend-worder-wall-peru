import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ClienteService } from '../../core/services/cliente.service';
import { ToastService } from '../../core/services/toast.service';
import { collectFormErrors } from '../../core/utils/form-errors.util';
import { CrearClienteRequest } from '../../core/models';

const LABELS: Record<string, string> = {
  tipoDocumento:   'Tipo de documento',
  numeroDocumento: 'Número de documento',
  nombres:         'Nombres',
  apellidoPaterno: 'Apellido paterno',
  fechaBoda:       'Fecha de boda',
  email:           'Email',
};

@Component({
  standalone: true,
  selector: 'app-registro-cliente',
  templateUrl: './registro-cliente.component.html',
  styleUrl: './registro-cliente.component.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ]
})
export class RegistroClienteComponent implements OnInit {
  private fb            = inject(FormBuilder);
  private route         = inject(ActivatedRoute);
  private clienteService = inject(ClienteService);
  private toast         = inject(ToastService);

  form: FormGroup;
  loading        = signal(false);
  success        = signal(false);
  validandoToken = signal(true);
  tokenValido    = signal(false);
  motivoInvalido = signal('');
  get minDate(): Date { return new Date(); }

  private token = '';

  constructor() {
    this.form = this.fb.group({
      tipoDocumento:            ['DNI', Validators.required],
      numeroDocumento:          ['', Validators.required],
      nombres:                  ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno:          ['', Validators.required],
      apellidoMaterno:          [''],
      fechaCumpleanios:         [null],
      fechaBoda:                [null, Validators.required],
      celular:                  [''],
      email:                    ['', [Validators.email]],
      nombreLocal:              [''],
      direccion:                [''],
      ubicacionMaps:            [''],
      horaLlegada:              [''],
      horaLlegadaPorConfirmar:  [true],
    });
  }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.validandoToken.set(false);
      this.tokenValido.set(false);
      this.motivoInvalido.set('El enlace no contiene un token de acceso.');
      return;
    }

    this.token = token;
    this.clienteService.validarToken(token).subscribe({
      next: ({ valido, motivo }) => {
        this.validandoToken.set(false);
        this.tokenValido.set(valido);
        if (!valido) this.motivoInvalido.set(this.mensajePorMotivo(motivo));
      },
      error: () => {
        this.validandoToken.set(false);
        this.tokenValido.set(false);
        this.motivoInvalido.set('No se pudo verificar el enlace. Intente más tarde.');
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      collectFormErrors(this.form, LABELS).forEach(msg => this.toast.error(msg));
      return;
    }

    const val = this.form.value;
    const request: CrearClienteRequest = {
      tipoDocumento:    val.tipoDocumento,
      numeroDocumento:  val.numeroDocumento,
      nombres:          val.nombres,
      apellidoPaterno:  val.apellidoPaterno,
      apellidoMaterno:  val.apellidoMaterno || undefined,
      fechaCumpleanios: val.fechaCumpleanios ? (val.fechaCumpleanios as Date).toISOString() : undefined,
      celular:          val.celular || undefined,
      email:            val.email || undefined,
      fechaBoda:        (val.fechaBoda as Date).toISOString(),
      logistica: (val.nombreLocal || val.direccion || val.horaLlegada) ? {
        nombreLocal:   val.nombreLocal || undefined,
        direccion:     val.direccion || undefined,
        ubicacionMaps: val.ubicacionMaps || undefined,
        horaLlegada:   (!val.horaLlegadaPorConfirmar && val.horaLlegada) ? val.horaLlegada : undefined,
      } : undefined,
      token: this.token,
    };

    this.loading.set(true);
    this.clienteService.crearCliente(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.form.reset();
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Error al guardar los datos. Intente nuevamente.');
      }
    });
  }

  nuevoRegistro(): void {
    this.success.set(false);
  }

  private mensajePorMotivo(motivo?: string): string {
    switch (motivo) {
      case 'EXPIRADO':      return 'El enlace ha expirado. Solicita uno nuevo.';
      case 'USADO':         return 'Este enlace ya fue utilizado para un registro.';
      case 'NO_ENCONTRADO': return 'El enlace no es válido.';
      default:              return 'El enlace no es válido o ya no está disponible.';
    }
  }
}
