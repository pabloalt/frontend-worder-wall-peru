import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClienteService } from '../../core/services/cliente.service';
import { CrearClienteRequest } from '../../core/models';

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
    MatSnackBarModule,
  ]
})
export class RegistroClienteComponent {
  form: FormGroup;
  loading = signal(false);
  success = signal(false);
  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      tipoDocumento:    ['DNI', Validators.required],
      numeroDocumento:  ['', Validators.required],
      nombres:          ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno:  ['', Validators.required],
      apellidoMaterno:  [''],
      fechaCumpleanios: [null],
      fechaBoda:        [null, Validators.required],
      celular:          [''],
      email:            ['', [Validators.email]],
      nombreLocal:      [''],
      direccion:        [''],
      ubicacionMaps:              [''],
      horaLlegada:                [''],
      horaLlegadaPorConfirmar:    [true],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
        this.snackBar.open('Error al guardar los datos. Intente nuevamente.', '✗', { duration: 4000 });
      }
    });
  }

  nuevoRegistro(): void {
    this.success.set(false);
  }
}
